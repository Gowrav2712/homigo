try:
    from kafka import KafkaProducer
except ImportError:
    KafkaProducer = None
import json

class NotificationProducer:
    def __init__(self):
        if KafkaProducer:
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=['localhost:9092'],
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
            except Exception:
                self.producer = None
        else:
            self.producer = None

    def send_notification(self, notification_data):
        if self.producer:
            try:
                self.producer.send('notifications', notification_data)
                self.producer.flush()
            except Exception:
                pass

