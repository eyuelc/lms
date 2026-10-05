<template>
	<div class="mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
		<div v-if="view === 'loading'" class="py-24 text-center text-sm text-ink-gray-5" role="status">
			{{ __('Loading...') }}
		</div>

		<!-- Under review -->
		<section v-else-if="view === 'review'" class="py-10 text-center">
			<Badge :label="app?.status || 'Pending'" theme="blue" size="md" />
			<h1 class="mt-5 text-2xl font-semibold text-ink-gray-9">{{ __('Application Under Review') }}</h1>
			<p class="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-gray-6">
				{{ __('Your instructor application has been submitted and is currently being reviewed by our team.') }}
			</p>
			<dl class="mx-auto mt-8 max-w-xs space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-ink-gray-5">{{ __('Status') }}</dt>
					<dd class="font-medium text-ink-gray-8">{{ app?.status }}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-ink-gray-5">{{ __('Submitted') }}</dt>
					<dd class="font-medium text-ink-gray-8">{{ formatDate(app?.creation) }}</dd>
				</div>
			</dl>
		</section>

		<!-- Approved -->
		<section v-else-if="view === 'approved'" class="py-10 text-center">
			<Badge label="Approved" theme="green" size="md" />
			<h1 class="mt-5 text-2xl font-semibold text-ink-gray-9">{{ __("You're an Instructor") }}</h1>
			<p class="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-gray-6">
				{{ __('Your instructor application has been approved. You can now access instructor features.') }}
			</p>
			<Button class="mt-8" variant="solid" size="md" @click="router.push({ name: 'Courses' })">
				{{ __('Go to Courses') }}
			</Button>
		</section>

		<!-- Rejected -->
		<section v-else-if="view === 'rejected'" class="py-10 text-center">
			<Badge label="Rejected" theme="red" size="md" />
			<h1 class="mt-5 text-2xl font-semibold text-ink-gray-9">{{ __('Application Not Approved') }}</h1>
			<p class="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-gray-6">
				{{ __('Your application was not approved at this time. You can continue learning as a student, and you are welcome to apply again.') }}
			</p>
			<div v-if="app?.admin_notes" class="mx-auto mt-6 max-w-md border-l-2 border-outline-gray-3 pl-4 text-left">
				<p class="text-xs font-medium uppercase tracking-wide text-ink-gray-5">{{ __('Feedback') }}</p>
				<p class="mt-1 whitespace-pre-line text-sm text-ink-gray-7">{{ app.admin_notes }}</p>
			</div>
			<Button class="mt-8" variant="solid" size="md" @click="startReapply">
				{{ __('Submit a New Application') }}
			</Button>
		</section>

		<!-- Form -->
		<form v-else novalidate @submit.prevent="submit">
			<header>
				<h1 class="text-3xl font-semibold tracking-tight text-ink-gray-9">{{ __('Become an Instructor') }}</h1>
				<p class="mt-2 text-base text-ink-gray-6">
					{{ __('Share your knowledge and expertise with our learning community.') }}
				</p>
			</header>

			<div v-if="app?.status === 'Changes Requested'" class="mt-8 border-l-2 border-outline-amber-2 pl-4" role="status">
				<p class="text-sm font-medium text-ink-gray-9">{{ __('Changes Requested') }}</p>
				<p class="mt-1 text-sm text-ink-gray-6">
					{{ __('The administrator has requested changes to your application.') }}
				</p>
				<p class="mt-3 text-xs font-medium uppercase tracking-wide text-ink-gray-5">{{ __('Admin feedback') }}</p>
				<p class="mt-1 whitespace-pre-line text-sm text-ink-gray-8">{{ app.admin_notes }}</p>
			</div>

			<p v-if="hasErrors" class="mt-6 text-sm text-ink-red-3" role="alert">
				{{ __('Please fix the highlighted fields.') }}
			</p>

			<!-- Personal -->
			<section class="mt-10 space-y-5" aria-labelledby="sec-personal">
				<h2 id="sec-personal" class="text-lg font-semibold text-ink-gray-9">{{ __('Personal Information') }}</h2>

				<div>
					<FormControl type="text" :label="__('Full Name')" v-model="form.full_name" :required="true" />
					<p v-if="errors.full_name" class="mt-1 text-xs text-ink-red-3">{{ errors.full_name }}</p>
				</div>

				<FormControl
					type="text"
					:label="__('Professional Title')"
					:placeholder="__('e.g. Senior Software Engineer')"
					v-model="form.professional_title"
				/>

				<div>
					<label class="mb-1.5 block text-xs text-ink-gray-5">{{ __('Profile Photo') }}</label>
					<FileUploader
						:file-types="['image/*']"
						:upload-args="{ private: false }"
						@success="(f) => (form.profile_image = f.file_url)"
						@failure="() => toast.error(__('Something went wrong. Please try again.'))"
					>
						<template #default="{ uploading, openFileSelector }">
							<div class="flex items-center gap-4">
								<img
									v-if="form.profile_image"
									:src="form.profile_image"
									:alt="__('Profile photo preview')"
									class="size-14 rounded-full object-cover"
								/>
								<Button type="button" :loading="uploading" @click="openFileSelector">
									{{ form.profile_image ? __('Change Photo') : __('Upload Photo') }}
								</Button>
							</div>
						</template>
					</FileUploader>
				</div>

				<div>
					<FormControl
						type="textarea"
						:rows="5"
						:label="__('About You')"
						:placeholder="__('A short introduction for learners.')"
						v-model="form.bio"
						:required="true"
					/>
					<p v-if="errors.bio" class="mt-1 text-xs text-ink-red-3">{{ errors.bio }}</p>
				</div>
			</section>

			<!-- Professional -->
			<section class="mt-12 space-y-5 border-t border-outline-gray-2 pt-10" aria-labelledby="sec-pro">
				<h2 id="sec-pro" class="text-lg font-semibold text-ink-gray-9">{{ __('Professional Background') }}</h2>
				<FormControl type="textarea" :rows="3" :label="__('Education')" v-model="form.education" />
				<FormControl type="textarea" :rows="4" :label="__('Professional Experience')" v-model="form.experience" />
				<div>
					<FormControl
						type="textarea"
						:rows="3"
						:label="__('Areas of Expertise')"
						:placeholder="__('e.g. Data structures, Python, System design')"
						v-model="form.expertise"
						:required="true"
					/>
					<p v-if="errors.expertise" class="mt-1 text-xs text-ink-red-3">{{ errors.expertise }}</p>
				</div>

				<div>
					<label class="mb-1.5 block text-xs text-ink-gray-5">{{ __('CV / Resume') }} *</label>
					<FileUploader
						:file-types="['.pdf', '.doc', '.docx']"
						:upload-args="{ private: true }"
						@success="onCvUploaded"
						@failure="() => toast.error(__('Something went wrong. Please try again.'))"
					>
						<template #default="{ uploading, openFileSelector }">
							<div class="flex flex-wrap items-center gap-3">
								<Button type="button" :loading="uploading" @click="openFileSelector">
									{{ form.cv ? __('Replace CV') : __('Upload CV') }}
								</Button>
								<span v-if="cvName" class="truncate text-sm text-ink-gray-7">{{ cvName }}</span>
							</div>
						</template>
					</FileUploader>
					<p class="mt-1.5 text-xs text-ink-gray-5">{{ __('PDF preferred. DOC and DOCX are also accepted.') }}</p>
					<p v-if="errors.cv" class="mt-1 text-xs text-ink-red-3">{{ errors.cv }}</p>
				</div>
			</section>

			<!-- Online presence -->
			<section class="mt-12 space-y-5 border-t border-outline-gray-2 pt-10" aria-labelledby="sec-online">
				<div>
					<h2 id="sec-online" class="text-lg font-semibold text-ink-gray-9">{{ __('Online Presence') }}</h2>
					<p class="mt-1 text-sm text-ink-gray-5">{{ __('Optional') }}</p>
				</div>
				<FormControl type="text" :label="__('LinkedIn')" placeholder="https://linkedin.com/in/..." v-model="form.linkedin" />
				<FormControl type="text" :label="__('GitHub')" placeholder="https://github.com/..." v-model="form.github" />
				<FormControl type="text" :label="__('Portfolio / Website')" placeholder="https://" v-model="form.portfolio" />
			</section>

			<!-- Teaching -->
			<section class="mt-12 space-y-5 border-t border-outline-gray-2 pt-10" aria-labelledby="sec-teach">
				<h2 id="sec-teach" class="text-lg font-semibold text-ink-gray-9">{{ __('Teaching') }}</h2>
				<div>
					<FormControl
						type="textarea"
						:rows="5"
						:label="__('Why Do You Want to Teach?')"
						v-model="form.teaching_reason"
						:required="true"
					/>
					<p v-if="errors.teaching_reason" class="mt-1 text-xs text-ink-red-3">{{ errors.teaching_reason }}</p>
				</div>
				<div>
					<FormControl
						type="text"
						:label="__('Course You Want to Teach')"
						v-model="form.proposed_course"
						:required="true"
					/>
					<p v-if="errors.proposed_course" class="mt-1 text-xs text-ink-red-3">{{ errors.proposed_course }}</p>
				</div>
			</section>

			<div class="mt-12 border-t border-outline-gray-2 pt-8">
				<Button type="submit" variant="solid" size="md" class="w-full sm:w-auto" :loading="submitting" :disabled="submitting">
					{{ app?.status === 'Changes Requested' ? __('Resubmit Application') : __('Submit Application') }}
				</Button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, FileUploader, FormControl, call, createResource, toast } from 'frappe-ui'
import { usersStore } from '@/stores/user'
const { userResource } = usersStore()

const router = useRouter()
const user = inject('$user')

const BASE = 'lms.lms.doctype.instructor_application.instructor_application.'
const FIELDS = [
	'full_name', 'professional_title', 'profile_image', 'bio', 'cv', 'education',
	'experience', 'expertise', 'linkedin', 'github', 'portfolio', 'teaching_reason', 'proposed_course',
]
const REQUIRED = {
	full_name: 'Full name is required.',
	bio: 'Please tell us a little about yourself.',
	cv: 'Please upload your CV.',
	expertise: 'Please list your areas of expertise.',
	teaching_reason: 'Please tell us why you want to teach.',
	proposed_course: 'Please enter the course you want to teach.',
}

const form = reactive(Object.fromEntries(FIELDS.map((f) => [f, ''])))
const errors = reactive({})
const submitting = ref(false)
const reapplying = ref(false)
const cvName = ref('')

const application = createResource({
	url: BASE + 'get_my_application',
	auto: true,
	onSuccess(data) {
		if (data?.status === 'Changes Requested') prefill(data)
		if (data?.status === 'Approved') {
			toast.success(__('Your instructor application has been approved.'))
			userResource.reload()
		}
	},
	onError() {
		toast.error(__('Something went wrong. Please try again.'))
	},
})

const app = computed(() => application.data)
const hasErrors = computed(() => Object.keys(errors).length > 0)

const view = computed(() => {
	if (application.loading && application.data === null) return 'loading'
	const status = app.value?.status
	if (!status) return 'form'
	if (status === 'Pending' || status === 'Under Review') return 'review'
	if (status === 'Approved') return 'approved'
	if (status === 'Rejected') return reapplying.value ? 'form' : 'rejected'
	return 'form' // Changes Requested
})

function prefill(data) {
	FIELDS.forEach((f) => (form[f] = data[f] || ''))
	cvName.value = data.cv ? data.cv.split('/').pop() : ''
}

function startReapply() {
	FIELDS.forEach((f) => (form[f] = ''))
	cvName.value = ''
	reapplying.value = true
}

function onCvUploaded(file) {
	form.cv = file.file_url
	cvName.value = file.file_name
	delete errors.cv
}

function validate() {
	Object.keys(errors).forEach((k) => delete errors[k])
	for (const [field, message] of Object.entries(REQUIRED)) {
		if (!String(form[field] || '').trim()) errors[field] = __(message)
	}
	return !hasErrors.value
}

async function submit() {
	if (submitting.value) return
	if (!validate()) {
		toast.error(__('Please fix the highlighted fields.'))
		return
	}
	submitting.value = true
	try {
		const method = app.value?.status === 'Changes Requested' ? 'resubmit_application' : 'submit_application'
		const result = await call(BASE + method, { data: { ...form } })
		application.setData(result)
		reapplying.value = false
		toast.success(__('Application submitted successfully.'))
		window.scrollTo({ top: 0, behavior: 'smooth' })
	} catch (e) {
		toast.error(e?.messages?.[0] || __('Something went wrong. Please try again.'))
	} finally {
		submitting.value = false
	}
}

function formatDate(value) {
	return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
}
</script>