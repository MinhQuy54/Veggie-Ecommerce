# Sử dụng bản slim để giữ image nhẹ nhưng vẫn đủ thư viện cần thiết
FROM python:3.11-slim

# Thiết lập các biến môi trường
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt các gói hệ thống cần thiết (ví dụ: cho PostgreSQL hoặc xử lý ảnh)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . /app/

# Gom các file tĩnh của Django (CSS, JS) vào thư mục STATIC_ROOT
RUN python manage.py collectstatic --noinput

# Render dùng cổng 10000 theo mặc định
EXPOSE 10000

# Lệnh khởi chạy ứng dụng bằng Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "myproject.wsgi:application"]