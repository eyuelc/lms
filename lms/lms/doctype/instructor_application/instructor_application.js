frappe.ui.form.on("Instructor Application", {
	refresh(frm) {
		if (frm.is_new() || !frappe.user.has_role(["System Manager", "Moderator"])) return;

		const base = "lms.lms.doctype.instructor_application.instructor_application.";
		const review = (label, method, status, notesRequired) => {
			if (frm.doc.status === status) return;
			frm.add_custom_button(
				__(label),
				() => {
					frappe.prompt(
						[
							{
								fieldname: "admin_notes",
								label: __("Notes for the applicant"),
								fieldtype: "Small Text",
								reqd: notesRequired ? 1 : 0,
								default: frm.doc.admin_notes,
							},
						],
						(values) => {
							frappe
								.call({
									method: base + method,
									args: { name: frm.doc.name, admin_notes: values.admin_notes },
								})
								.then(() => frm.reload_doc());
						},
						__(label),
						__("Confirm")
					);
				},
				__("Review")
			);
		};

		review("Approve", "approve_application", "Approved", false);
		review("Request Changes", "request_changes", "Changes Requested", true);
		review("Reject", "reject_application", "Rejected", true);

		["linkedin", "github", "portfolio"].forEach((f) => {
			if (frm.doc[f]) {
				frm.add_custom_button(__(f.charAt(0).toUpperCase() + f.slice(1)), () => window.open(frm.doc[f], "_blank", "noopener"), __("Links"));
			}
		});
	},
});
