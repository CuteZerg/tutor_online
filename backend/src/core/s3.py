import boto3
from botocore.exceptions import ClientError
from botocore.client import Config
from src.core.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket = settings.YANDEX_S3_BUCKET
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.YANDEX_S3_ENDPOINT_URL,
            aws_access_key_id=settings.YANDEX_S3_ACCESS_KEY,
            aws_secret_access_key=settings.YANDEX_S3_SECRET_KEY,
            region_name='ru-central1',
            config=Config(signature_version='s3v4')
        )

    def upload_file(self, file_obj, filename: str, content_type: str = 'application/octet-stream') -> str:
        """Uploads a file to Yandex S3 and returns the generated S3 key."""
        ext = filename.split('.')[-1] if '.' in filename else ''
        s3_key = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
        
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket,
                s3_key,
                ExtraArgs={'ContentType': content_type}
            )
            return s3_key
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise

    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Generates a presigned URL for secure access."""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket,
                    'Key': s3_key,
                    'ResponseContentDisposition': 'inline'
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise

s3_service = S3Service()
