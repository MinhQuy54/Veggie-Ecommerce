FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/veggie

CMD ["sh", "-c", "sleep 15 && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
