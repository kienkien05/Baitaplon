def notify_admins(title: str, message: str) -> None:
    try:
        admins = users_collection.find({"is_admin": True})
        if not admins:
            print("No admin users found")
            return

        for admin in admins:
            create_notification(str(admin["_id"]), title, message)
        print(f"Notification sent to admins: {title}")
    except Exception as e:
        print(f"Error in notify_admins: {str(e)}")
