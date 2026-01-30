"""
ASGI config for SST Platform project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sst_platform.settings')

application = get_asgi_application()
