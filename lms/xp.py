import frappe


def create_user_xp(doc, method=None):
    if frappe.db.exists("XP", {"user": doc.name}):
        return

    frappe.get_doc({
        "doctype": "XP",
        "user": doc.name,
        "value": 0
    }).insert(ignore_permissions=True)