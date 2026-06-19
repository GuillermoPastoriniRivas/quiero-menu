<div align="center">

# 🍽️ Quiero Menú

### A QR digital menu for restaurants — fast to run, cheap to host

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](#)
[![AWS](https://img.shields.io/badge/AWS-232F3E?logo=amazonaws&logoColor=white)](#)

*Diners scan a QR code and browse a live, image-rich menu. Owners manage it from a clean admin — no app to install.*

</div>

---

## ✨ Features

- 📱 **Scan-to-browse** — a QR code opens an instant, mobile-first menu. No downloads, no friction.
- 🖼️ **Rich items** — photos (stored on S3), categories, prices and availability, editable in real time.
- ⚡ **Live updates** — changes propagate over WebSockets.
- 🔐 **Owner admin** — JWT auth, per-restaurant management.
- 💸 **Runs for ~$15–20/month** — a documented single-box deployment ([`DEPLOY.md`](./DEPLOY.md)).

## 🛠️ Tech stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | NestJS (hexagonal / DDD) · MongoDB + Mongoose · WebSockets · JWT · AWS S3 + SES · Helmet |
| **Frontend** | React · TypeScript |
| **Infra** | Docker Compose · Nginx · Let's Encrypt · EC2 · MongoDB Atlas · CloudFront |

## 🚀 Quick start

```bash
cd api
cp .env.example .env        # MONGODB_URI, JWT secret, AWS keys
npm install
npm run start:dev

cd ../ui
npm install && npm start
```

## ☁️ Deploy

The included [`DEPLOY.md`](./DEPLOY.md) walks through a complete, low-cost stack: a single **EC2 t3.small** running Docker Compose behind **Nginx + Let's Encrypt**, with **MongoDB Atlas**, **SES** for email and **CloudFront** in front — about **$15–20/month**.

## 📁 Project structure

```
quiero-menu/
├── api/     # NestJS backend (DDD/hexagonal)
├── ui/      # React client + admin
└── infra/   # Docker Compose & deploy config
```

---

<div align="center">
<sub>Built by <a href="https://github.com/GuillermoPastoriniRivas">Guillermo Pastorini</a></sub>
</div>
