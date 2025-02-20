# Generated by Django 3.0.5 on 2020-12-03 08:43

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('WeHelpServer', '0003_auto_20201203_0841'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chat',
            name='last_message',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='message_chat', to='WeHelpServer.Message'),
        ),
        migrations.AlterField(
            model_name='task',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='publish_task', to='WeHelpServer.User'),
        ),
    ]
