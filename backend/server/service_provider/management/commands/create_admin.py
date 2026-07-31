from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Creates or resets the admin superuser for deployment'

    def handle(self, *args, **options):
        User = get_user_model()
        username = 'admin'
        email = 'homigo24@gmail.com'
        password = 'admin@homigo123'

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created successfully'))
        else:
            u = User.objects.get(username=username)
            u.is_staff = True
            u.is_superuser = True
            u.set_password(password)
            u.save()
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" password updated successfully'))
