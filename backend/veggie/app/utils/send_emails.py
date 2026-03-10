import requests
import os

def send_email(to_email, subject, html):
    api_key = os.getenv("RESEND_API_KEY")
    url = "https://api.resend.com/emails"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "from": "onboarding@resend.dev",
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    response = requests.post(url, json=payload, headers=headers)

    print(response.status_code)
    print(response.text)