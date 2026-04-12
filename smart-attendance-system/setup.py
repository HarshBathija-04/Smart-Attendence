#!/usr/bin/env python3
"""
Smart Attendance Web System - Setup Script
==========================================
MCA Final Year Project - Aditya University (2025-2026)
Student: Adapa Veera Venkata Satyanarayana
Roll No: 24M11MC193

This script helps set up the Smart Attendance Web System by:
1. Checking Python version
2. Creating virtual environment
3. Installing dependencies
4. Setting up the database
5. Creating necessary directories
"""

import sys
import os
import subprocess
import platform

def print_header():
    """Print setup header"""
    print("=" * 70)
    print(" " * 15 + "Smart Attendance Web System")
    print(" " * 10 + "MCA Project - Aditya University (2025-2026)")
    print("=" * 70)
    print()

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    print("[1/5] Checking Python version...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python {version.major}.{version.minor} detected.")
        print("❌ Python 3.8 or higher is required.")
        print("Please upgrade Python and try again.")
        return False
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected.")
    return True

def create_virtual_environment():
    """Create virtual environment"""
    print("\n[2/5] Creating virtual environment...")
    
    venv_path = os.path.join(os.path.dirname(__file__), 'venv')
    
    if os.path.exists(venv_path):
        print("⚠️  Virtual environment already exists.")
        response = input("Do you want to recreate it? (y/n): ").lower()
        if response == 'y':
            import shutil
            shutil.rmtree(venv_path)
        else:
            print("✅ Using existing virtual environment.")
            return True
    
    try:
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
        print("✅ Virtual environment created successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create virtual environment: {e}")
        return False

def get_pip_executable():
    """Get the pip executable path based on OS"""
    if platform.system() == 'Windows':
        return os.path.join('venv', 'Scripts', 'pip.exe')
    else:
        return os.path.join('venv', 'bin', 'pip')

def get_python_executable():
    """Get the python executable path based on OS"""
    if platform.system() == 'Windows':
        return os.path.join('venv', 'Scripts', 'python.exe')
    else:
        return os.path.join('venv', 'bin', 'python')

def install_dependencies():
    """Install required packages"""
    print("\n[3/5] Installing dependencies...")
    print("This may take several minutes. Please be patient...")
    
    pip_exe = get_pip_executable()
    requirements_file = os.path.join('backend', 'requirements.txt')
    
    if not os.path.exists(requirements_file):
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    try:
        # Upgrade pip first
        subprocess.run([pip_exe, 'install', '--upgrade', 'pip'], check=True)
        
        # Install requirements
        result = subprocess.run(
            [pip_exe, 'install', '-r', requirements_file],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully.")
            return True
        else:
            print("❌ Failed to install dependencies.")
            print("Error:", result.stderr)
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    print("\n[4/5] Setting up directories...")
    
    directories = [
        'database',
        'datasets',
        'datasets/registered_faces',
        'screenshots'
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"  ✅ Created: {directory}")
        else:
            print(f"  ⚠️  Already exists: {directory}")
    
    print("✅ Directories setup complete.")
    return True

def initialize_database():
    """Initialize the database"""
    print("\n[5/5] Initializing database...")
    
    python_exe = get_python_executable()
    
    # Create a temporary script to initialize database
    init_script = """
import sys
sys.path.insert(0, 'backend')

from flask import Flask
from database import init_db, db, User
from auth import hash_password

app = Flask(__name__)
app.config['SECRET_KEY'] = 'smart-attendance-secret-key-2025'

init_db(app)

with app.app_context():
    # Check if admin exists
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        default_admin = User(
            username='admin',
            password=hash_password('admin123'),
            name='System Administrator',
            role='admin',
            is_active=True
        )
        db.session.add(default_admin)
        db.session.commit()
        print("✅ Default admin created: username='admin', password='admin123'")
    else:
        print("✅ Admin user already exists")
    
    print("✅ Database initialized successfully")
"""
    
    try:
        result = subprocess.run(
            [python_exe, '-c', init_script],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__)
        )
        
        print(result.stdout)
        if result.returncode != 0:
            print("Error:", result.stderr)
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

def print_completion_message():
    """Print completion message with instructions"""
    print("\n" + "=" * 70)
    print(" " * 20 + "Setup Complete!")
    print("=" * 70)
    print()
    print("📋 Next Steps:")
    print()
    
    if platform.system() == 'Windows':
        print("1. Activate virtual environment:")
        print("   venv\\Scripts\\activate")
    else:
        print("1. Activate virtual environment:")
        print("   source venv/bin/activate")
    
    print()
    print("2. Navigate to backend directory:")
    print("   cd backend")
    print()
    print("3. Run the application:")
    print("   python app.py")
    print()
    print("4. Open your browser and go to:")
    print("   http://localhost:5000")
    print()
    print("📧 Default Admin Credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    print()
    print("📖 For more information, see README.md")
    print()
    print("=" * 70)

def main():
    """Main setup function"""
    print_header()
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_environment():
        print("\n⚠️  Continuing without virtual environment...")
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Initialize database
    initialize_database()
    
    # Print completion message
    print_completion_message()

if __name__ == '__main__':
    main()
