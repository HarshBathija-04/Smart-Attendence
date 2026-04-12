# SMART ATTENDANCE SYSTEM: WEBSITE DOCUMENTATION

## 🌐 Project Overview

The **Smart Attendance System** is a high-performance web application designed to automate institutional attendance via advanced biometric facial recognition. This documentation serves as a comprehensive guide for administrators and users to navigate the platform effectively.

---

## 🚀 Getting Started

### 1. Administrative Login

To access the management portal, navigate to the `/login` page.

- **Username:** `admin` (Default)
- **Password:** `admin123` (Default)
  _Note: It is highly recommended to update your password immediately after the first login for security purposes._

### 2. The Dashboard Experience

Once logged in, you will be redirected to the **Real-time Governance Dashboard**.

- **Real-time Stats:** View the total number of enrolled students and a live count of students present today.
- **Attendance Log:** A dynamic table displaying every recognition event with timestamps and matching confidence scores.
- **Exporting Data:** Click the **"Export CSV"** button to download the current attendance records for offline analysis.

---

## 📸 Core Functionalities

### 3. Student Registration (Enrolment)

Before a student can mark their attendance, their biometric profile must be created.

1. Navigate to the **"Register Student"** section.
2. Enter the student's **Full Name**, **Roll Number**, and **Department**.
3. **Capture Face:** Ensure the student is in a well-lit area. You can either take a live photo via the webcam or upload a clear frontal portrait.
4. Click **"Complete Enrollment"**. The system will now generate a unique mathematical vector for the student.

### 4. Marking Attendance (Kiosk Mode)

The attendance terminal is designed for rapid, "no-click" interaction.

1. Open the **"Take Attendance"** page on a tablet or computer at the entrance.
2. The student stands in front of the camera HUD.
3. The system automatically detects the face and searches the database.
4. **Success:** A green HUD effect and a confirmation message appear.
5. **Already Marked:** If the student scans again, the system will notify them that their attendance is already logged.

---

## 🛠️ Technical Insights

### Biometric Security

We do not store raw images of student faces. Our **"Privacy-First"** architecture converts every face into a 128-dimensional vector. Even if the database is breached, the original facial features cannot be reconstructed.

### Matching Algorithm

The system utilizes **InsightFace (buffalo_l)** with a cosine similarity threshold of **0.40**. This ensures that even with minor changes in appearance (glasses, haircut), the student remains recognizable.

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Why is the system not recognizing a specific student?**
_A: Common causes include poor lighting, face masks, or significant obstruction of the eyes. Ensure the student is facing the camera directly._

**Q: Can I use multiple cameras?**
_A: Yes, the web-based nature allows you to open the attendance link on multiple terminals simultaneously._

**Q: How do I backup the data?**
_A: All data is stored in a secure cloud database (Supabase). Backups are handled automatically on the cloud provider side._

---

## 🆘 Troubleshooting

- **Camera Not Loading:** Ensure you have granted "Camera Permissions" to the browser.
- **Server Error:** Check your internet connection or verify if the backend server process is running.
- **Low Confidence Scores:** Improve the lighting in the scanning area or recalibrate the student's profile photo.

---

**© 2026 Smart Attendance System | Developed by Adapa Veera Venkata Satyanarayana**
