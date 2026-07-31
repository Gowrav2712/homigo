#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r ../requirements.txt
pip install whitenoise gunicorn daphne

python manage.py collectstatic --no-input
python manage.py migrate

# Create or update superuser on deployment
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
username = 'admin'
email = 'admin@example.com'
password = 'admin123'
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print('Superuser created')
else:
    u = User.objects.get(username=username)
    u.is_staff = True
    u.is_superuser = True
    u.set_password(password)
    u.save()
    print('Superuser password updated')
"

