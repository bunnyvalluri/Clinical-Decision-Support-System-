"""
Management command to seed realistic, high-quality clinical and educational articles
for the HealthNova AI Blog platform.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.blog.models import (
    BlogCategory,
    BlogAuthor,
    BlogArticle,
    ArticleStatus,
    MedicalReviewStatus,
)


class Command(BaseCommand):
    help = "Seeds initial high-quality clinical and educational articles for HealthNova AI Blog"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding HealthNova AI Blog categories..."))

        categories_data = [
            ("Healthcare", "healthcare", "Clinical workflows, cardiovascular care, and acute hospital intelligence.", "Stethoscope", 1),
            ("Preventive Care", "preventive-care", "Early detection protocols, risk assessment, and preventative habits.", "ShieldCheck", 2),
            ("AI & ML", "ai-ml", "Machine learning architectures, TreeSHAP explainability, and predictive models.", "Cpu", 3),
            ("Digital Health", "digital-health", "Wearable sensors, mobile telemetry, and real-time remote patient monitoring.", "Smartphone", 4),
            ("Wellness", "wellness", "Sleep optimization, stress mitigation, and evidence-based patient wellbeing.", "Heart", 5),
            ("Patient Stories", "patient-stories", "Human perspectives on proactive health management and patient empowerment.", "Users", 6),
            ("Research", "research", "Clinical trial syntheses, KDIGO/AHA guidelines, and medical informatics studies.", "BookOpen", 7),
            ("Product Updates", "product-updates", "Platform enhancements, FDA alignment milestones, and enterprise features.", "Sparkles", 8),
        ]

        categories = {}
        for name, slug, desc, icon, order in categories_data:
            cat, _ = BlogCategory.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "description": desc, "icon_name": icon, "order": order},
            )
            categories[slug] = cat

        self.stdout.write(self.style.NOTICE("Seeding verified author profiles..."))
        authors_data = [
            ("Dr. Ananya Rao", "Senior Attending Cardiologist & Clinical AI Fellow", "/avatars/doctor-ananya.png", "Cardiologist specializing in electrophysiology and real-time hemodynamic risk monitoring."),
            ("Dr. Rohan Mehta", "Clinical Nutrition & Preventive Cardiology Lead", "/avatars/doctor-rohan.png", "Physician focused on metabolic syndrome intervention through explainable AI models."),
            ("Sneha Patel", "Sleep Informatics & Bio-signals Researcher", "/avatars/researcher-sneha.png", "Biomedical engineer analyzing photoplethysmography and actigraphy time-series telemetry."),
            ("Priya Sharma", "Lead AI Architect & Medical Informatics Fellow", "/avatars/architect-priya.png", "ML researcher leading multimodal clinical transformers and TreeSHAP attribution systems."),
            ("Kavya Nair", "Patient Education & Care Continuity Coordinator", "/avatars/coordinator-kavya.png", "Clinical nurse specialist dedicated to health literacy and doctor-patient communication."),
            ("Arjun Verma", "Senior Healthcare Mobile Systems Engineer", "/avatars/engineer-arjun.png", "Engineer focused on FHIR-compliant mobile health applications and edge encryption."),
            ("Neha Reddy", "Preventive Physiology & Rehabilitation Specialist", "/avatars/physiologist-neha.png", "Exercise physiologist evaluating continuous cardiopulmonary metrics."),
        ]

        authors = {}
        for name, role, avatar, bio in authors_data:
            auth, _ = BlogAuthor.objects.get_or_create(
                name=name,
                defaults={"role_title": role, "avatar_url": avatar, "bio": bio},
            )
            authors[name] = auth

        self.stdout.write(self.style.NOTICE("Seeding published articles & guides..."))

        # 1. Featured Article
        featured_title = "AI + Wearables: The Future of Continuous Health Monitoring"
        BlogArticle.objects.update_or_create(
            slug="ai-wearables-continuous-health-monitoring",
            defaults={
                "title": featured_title,
                "excerpt": "Discover how AI and wearable devices are transforming preventive healthcare with real-time insights.",
                "content": """## The Shift from Episodic Care to Continuous Surveillance

Traditional cardiovascular care has long depended on episodic snapshots: clinical vitals collected during 15-minute consultations every six months. While vital, these sporadic checkpoints routinely miss transient arrhythmias, paroxysmal atrial fibrillation, and silent nocturnal hypertensive crises.

### The Role of Edge Machine Learning

Modern medical-grade wearables equipped with photoplethysmography (PPG) and single-lead electrocardiography (ECG) sensors capture thousands of data points daily. When coupled with lightweight on-device Random Forest and Gradient Boosting ensembles, these sensors can classify anomalies with sub-20ms latency.

> **Clinical Boundary Disclaimer:** Continuous wearable algorithms serve solely as early advisory tripwires. Confirmatory 12-lead ECGs and licensed physician review remain mandatory prior to diagnostic or therapeutic interventions.

### Key Clinical Advantages:
1. **Sub-clinical detection**: Detecting autonomic nervous system dysregulation hours before symptomatic tachycardia.
2. **Contextual risk modeling**: Correlating sudden heart-rate spikes with sleep stages, ambient temperature, and patient activity.
3. **Closing the feedback loop**: Empowering multidisciplinary cardiology teams with verified trendlines rather than patient recall.
""",
                "featured_image": "/blog/wearables-monitoring.jpg",
                "category": categories["digital-health"],
                "author": authors["Dr. Ananya Rao"],
                "tags": ["Wearables", "AI", "Cardiology", "Continuous Monitoring"],
                "status": ArticleStatus.PUBLISHED,
                "is_featured": True,
                "is_guide": False,
                "reading_time_minutes": 8,
                "medical_review_status": MedicalReviewStatus.VERIFIED,
                "views_count": 1420,
                "seo_title": "AI + Wearables: The Future of Continuous Health Monitoring",
                "seo_description": "Explore how edge machine learning and wearable biosensors are reshaping preventive cardiology and continuous patient monitoring.",
                "published_at": timezone.now() - timezone.timedelta(days=8),
            },
        )

        # 2. Recent Articles matching reference cards
        recent_articles = [
            {
                "slug": "ai-sleep-tracking-changing-sleep-monitoring",
                "title": "A Sleep Tracking: How AI is Changing Sleep Monitoring",
                "excerpt": "Learn how AI-powered sleep trackers can improve sleep quality and overall health.",
                "category": categories["wellness"],
                "author": authors["Sneha Patel"],
                "tags": ["Sleep", "AI", "Wellness", "Telemetry"],
                "reading_time": 6,
                "views": 890,
                "days_ago": 21,
                "image": "/blog/sleep-tracking.jpg",
            },
            {
                "slug": "ai-powered-personalized-nutrition-complete-guide",
                "title": "AI-Powered Personalized Nutrition: A Complete Guide",
                "excerpt": "How AI helps create personalized diet plans for better health and disease prevention.",
                "category": categories["healthcare"],
                "author": authors["Dr. Rohan Mehta"],
                "tags": ["Nutrition", "Metabolism", "Cardiology", "AI"],
                "reading_time": 7,
                "views": 1120,
                "days_ago": 27,
                "image": "/blog/personalized-nutrition.jpg",
            },
            {
                "slug": "multimodal-ai-in-healthcare-complete-guide",
                "title": "Multimodal AI in Healthcare: A Complete Guide",
                "excerpt": "Exploring how text, images and clinical data work together for better predictions.",
                "category": categories["ai-ml"],
                "author": authors["Priya Sharma"],
                "tags": ["Multimodal", "TreeSHAP", "EHR", "Computer Vision"],
                "reading_time": 8,
                "views": 1340,
                "days_ago": 31,
                "image": "/blog/multimodal-ai.jpg",
            },
            {
                "slug": "ai-health-assistants-vs-human-health-coach",
                "title": "AI Health Assistants vs Human Health Coach",
                "excerpt": "Which one is right for your health journey? A detailed comparison.",
                "category": categories["patient-stories"],
                "author": authors["Kavya Nair"],
                "tags": ["Coaching", "Health Literacy", "Patient Empowerment"],
                "reading_time": 5,
                "views": 670,
                "days_ago": 37,
                "image": "/blog/health-assistant-coach.jpg",
            },
            {
                "slug": "affordable-ai-health-apps-without-compromising-safety",
                "title": "Affordable AI Health Apps That Do Not Compromise on Safety",
                "excerpt": "Top AI health apps that are reliable, useful and budget-friendly.",
                "category": categories["digital-health"],
                "author": authors["Arjun Verma"],
                "tags": ["Mobile Health", "Security", "HIPAA", "Safety"],
                "reading_time": 7,
                "views": 780,
                "days_ago": 44,
                "image": "/blog/affordable-health-apps.jpg",
            },
            {
                "slug": "cardio-vs-strength-training-whats-better",
                "title": "Cardio vs Strength Training: What's Better?",
                "excerpt": "A science-backed comparison to help you build a healthier lifestyle.",
                "category": categories["preventive-care"],
                "author": authors["Neha Reddy"],
                "tags": ["Cardio", "Strength", "Physiology", "Longevity"],
                "reading_time": 6,
                "views": 940,
                "days_ago": 51,
                "image": "/blog/cardio-strength.jpg",
            },
        ]

        for item in recent_articles:
            BlogArticle.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "excerpt": item["excerpt"],
                    "content": f"""## Overview: {item['title']}\n\nComprehensive exploration of clinical standards, peer-reviewed literature, and algorithmic best practices.\n\n### Clinical Perspectives\nEvidence-based healthcare decision support emphasizes context minimization, strict data governance, and clinician-in-the-loop validation.""",
                    "featured_image": item["image"],
                    "category": item["category"],
                    "author": item["author"],
                    "tags": item["tags"],
                    "status": ArticleStatus.PUBLISHED,
                    "is_featured": False,
                    "is_guide": False,
                    "reading_time_minutes": item["reading_time"],
                    "medical_review_status": MedicalReviewStatus.VERIFIED,
                    "views_count": item["views"],
                    "published_at": timezone.now() - timezone.timedelta(days=item["days_ago"]),
                },
            )

        # 3. Popular Guides
        guides = [
            ("10 Daily Habits for a Healthier Life", "10-daily-habits-for-a-healthier-life", categories["wellness"], authors["Sneha Patel"], 39, "/blog/guide-daily-habits.jpg"),
            ("Beginner's Guide to AI in Healthcare", "beginners-guide-to-ai-in-healthcare", categories["ai-ml"], authors["Priya Sharma"], 47, "/blog/guide-beginner-ai.jpg"),
            ("Understanding Your Health Reports", "understanding-your-health-reports", categories["healthcare"], authors["Dr. Rohan Mehta"], 55, "/blog/guide-health-reports.jpg"),
            ("Nutrition Tips for Busy Professionals", "nutrition-tips-for-busy-professionals", categories["preventive-care"], authors["Dr. Rohan Mehta"], 62, "/blog/guide-nutrition-tips.jpg"),
        ]

        for g_title, g_slug, g_cat, g_auth, g_days, g_img in guides:
            BlogArticle.objects.update_or_create(
                slug=g_slug,
                defaults={
                    "title": g_title,
                    "excerpt": f"Practical, verified clinical checklist and actionable advice: {g_title}.",
                    "content": f"""## Clinical Quick Reference: {g_title}\n\nA structured educational roadmap created by multidisciplinary healthcare specialists.""",
                    "featured_image": g_img,
                    "category": g_cat,
                    "author": g_auth,
                    "tags": ["Guide", "Education", "Checklist"],
                    "status": ArticleStatus.PUBLISHED,
                    "is_featured": False,
                    "is_guide": True,
                    "reading_time_minutes": 4,
                    "medical_review_status": MedicalReviewStatus.VERIFIED,
                    "views_count": 520,
                    "published_at": timezone.now() - timezone.timedelta(days=g_days),
                },
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded HealthNova AI Blog platform!"))
