import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "smart-attendance-secret-key";

// Ensure admin exists
async function initAdmin() {
  try {
    const adminExists = await prisma.admin.findFirst();
    if (!adminExists) {
      const hashed = await bcrypt.hash("admin123", 10);
      await prisma.admin.create({
        data: { username: "admin", password: hashed },
      });
      console.log("Default admin created: admin / admin123");
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Smart Attendance API is running" });
});

// ---------------------------
// AUTH ROUTES
// ---------------------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });
    
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ id: admin.id, role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, username: admin.username });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ---------------------------
// STUDENT ENDPOINTS
// ---------------------------
app.post("/api/students/register", authenticateToken, async (req, res) => {
  try {
    const { name, rollNumber, department, imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Image is required" });

    // Save as binary JPG instead of base64 text
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');
    const tempImgPath = path.join(__dirname, `../temp_reg_${Date.now()}.jpg`);
    fs.writeFileSync(tempImgPath, imgBuffer);

    const scriptPath = path.join(__dirname, "../face_recognition_script.py");
    
    exec(`python "${scriptPath}" encode "${tempImgPath}"`, async (error, stdout, stderr) => {
      if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
      
      if (error) {
        console.error("Python Error:", stderr);
        return res.status(500).json({ error: "Python execution failed" });
      }
      
      try {
        // Look for the specific RESULT_JSON prefix
        const resultPrefix = "RESULT_JSON:";
        const resultIndex = stdout.indexOf(resultPrefix);
        
        if (resultIndex === -1) {
          throw new Error("Could not find result in output. Raw output: " + stdout);
        }
        
        const jsonContent = stdout.substring(resultIndex + resultPrefix.length).trim();
        const result = JSON.parse(jsonContent);
        
        if (result.error) return res.status(400).json({ error: result.error });

        const newStudent = await prisma.student.create({
          data: {
            name,
            rollNumber,
            department,
            faceEncoding: result.encoding
          }
        });
        res.json({ success: true, message: "Student registered", student: newStudent });
      } catch (e: any) {
        console.error("Parse Error:", e.message, "Raw stdout:", stdout);
        res.status(500).json({ error: "Failed to parse encoding result: " + e.message });
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/students", authenticateToken, async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/students/:id", authenticateToken, async (req, res) => {
  try {
    await prisma.student.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------
// ATTENDANCE ENDPOINTS
// ---------------------------
app.post("/api/attendance/mark", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Image is required" });

    const students = await prisma.student.findMany();
    if (students.length === 0) return res.status(400).json({ error: "No registered students" });

    // Prepare students list for Python
    const studentsData = students.map(s => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      faceEncoding: s.faceEncoding
    }));

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');
    
    const tempImgPath = path.join(__dirname, `../temp_att_${Date.now()}.jpg`);
    const tempDbPath = path.join(__dirname, `../temp_db_${Date.now()}.json`);
    
    fs.writeFileSync(tempImgPath, imgBuffer);
    fs.writeFileSync(tempDbPath, JSON.stringify(studentsData));

    const scriptPath = path.join(__dirname, "../face_recognition_script.py");
    exec(`python "${scriptPath}" match "${tempImgPath}" "${tempDbPath}"`, async (error, stdout, stderr) => {
      if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      
      if (error) {
        console.error("Python Error:", stderr);
        return res.status(500).json({ error: "Face recognition failed" });
      }
      
      try {
        // Look for the specific RESULT_JSON prefix
        const resultPrefix = "RESULT_JSON:";
        const resultIndex = stdout.indexOf(resultPrefix);
        
        if (resultIndex === -1) {
          throw new Error("Could not find result in output. Raw output: " + stdout);
        }
        
        const jsonContent = stdout.substring(resultIndex + resultPrefix.length).trim();
        const result = JSON.parse(jsonContent);

        if (result.error) return res.status(400).json({ error: result.error });
        if (!result.match) return res.status(400).json({ error: "Face not recognized" });

        const matchedStudent = result.student;

        const today = new Date();
        today.setHours(0,0,0,0);
        
        const existingInfo = await prisma.attendance.findFirst({
           where: {
             studentId: matchedStudent.id,
             date: { gte: today }
           }
        });
        
        if (existingInfo) {
           return res.json({ 
             success: true, 
             message: "Attendance already marked for today", 
             student: matchedStudent
           });
        }

        await prisma.attendance.create({
          data: {
            studentId: matchedStudent.id,
            matchScore: result.score
          }
        });

        res.json({ 
          success: true, 
          message: "Attendance marked successfully!",
          student: matchedStudent
        });
      } catch(e: any) {
        console.error("Parse Error:", e.message, "Raw stdout:", stdout);
        res.status(500).json({ error: "Failed to parse recognition results: " + e.message });
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/attendance/today", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: today } },
      include: { student: true }
    });
    
    res.json(attendances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const totalStudents = await prisma.student.count();
    const presentToday = await prisma.attendance.count({
      where: { date: { gte: today } }
    });
    
    res.json({
       totalStudents,
       presentToday,
       absentToday: totalStudents - presentToday
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  await initAdmin();
  console.log(`Server running on http://localhost:${PORT}`);
});

// Extra keep-alive for some environments
setInterval(() => {}, 1000000);
