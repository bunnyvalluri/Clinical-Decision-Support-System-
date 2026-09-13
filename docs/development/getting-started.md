# Developer Getting Started Guide

Welcome to the PatientRisk CDSS development team. Follow these steps to prepare your local machine.

---

## 1. Initial Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/hospital/patientrisk-cdss.git
   cd patientrisk-cdss
   ```
2. **Initialize Environment Variables:**
   ```bash
   cp .env.example .env
   ```
3. **Boot Local Stack:**
   ```bash
   docker-compose up -d
   ```
4. **Run Migrations & Seed Active Model:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```
