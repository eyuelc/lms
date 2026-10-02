import AudioBlock from '@/components/AudioBlock.vue'
import UploadPlugin from '@/components/UploadPlugin.vue'
import { registerDirectives } from '@/directives'
import { h, createApp } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import translationPlugin from '../translation'

export class Audio {
	constructor({ data, config, readOnly }) {
		this.data = data || {}
		this.config = config || {}
		this.readOnly = readOnly
	}

	static get toolbox() {
		const app = createApp({
			render: () =>
				h(Volume2, {
					size: 18,
					strokeWidth: 1.5,
				}),
		})

		registerDirectives(app)

		const div = document.createElement('div')
		app.mount(div)

		return {
			title: 'Audio',
			icon: div.innerHTML,
		}
	}

	static get isReadOnlySupported() {
		return true
	}

	render() {
		this.wrapper = document.createElement('div')

		if (this.data.file_url) {
			this.renderAudio(this.data)
		} else if (!this.readOnly) {
			this.renderUploader()
		}

		return this.wrapper
	}

	renderUploader() {
		const app = createApp(UploadPlugin, {
			uploadContext: this.config,

			onFileUploaded: (file) => {
				const audioTypes = ['mp3', 'wav', 'ogg']

				if (!audioTypes.includes(file.file_type?.toLowerCase())) {
					return
				}

				this.data.file_url = file.file_url
				this.data.file_type = file.file_type

				this.renderAudio(this.data)
			},
		})

		registerDirectives(app)
		app.use(translationPlugin)
		app.mount(this.wrapper)

		this.app = app
	}

	renderAudio(file) {
		const app = createApp(AudioBlock, {
			file: file.file_url,
		})

		registerDirectives(app)
		app.use(translationPlugin)
		app.mount(this.wrapper)

		this.app = app
	}

	validate(savedData) {
		return !!(savedData.file_url && savedData.file_type)
	}

	save() {
		return {
			file_url: this.data.file_url,
			file_type: this.data.file_type,
		}
	}

	destroy() {
		if (this.app) {
			this.app.unmount()
			this.app = null
		}
	}
}
