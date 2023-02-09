/**
 * Class to validate and send data to the backend
 * The code is going to send data to the endpoint that specialized in the action of html form
 */
class FormManager {
    constructor(form, fields) {
        this.form = form
        this.fields = fields
    }

    initialize() {
        this.listenEvents()
    }

    /**
     * Adds event listeners for data change in the fields
     */
    listenEvents() {
        let self = this
        this.fields.forEach(field => {
            const input = document.querySelector(`#${field}`)

            input.addEventListener('input', event => {
                self.validateFields(event.target)
            })
            input.addEventListener('blur', event => {
                self.validateFields(event.target)
            })
        })

        // Submit event for form
        this.form.addEventListener('submit', e => {
            e.preventDefault()
            let status = true
            self.fields.forEach(field => {
                const input = document.querySelector(`#${field}`)
                status = (status && self.validateFields(input))
            })
            if (status) {
                this.sendFormData();
            }
        })
    }

    /**
     * Validates given field
     * @param {HTMLElement} field 
     */
    validateFields(field) {
        let status = 'success'
        let message = null

        if (field.value.trim() === "") {
            status = 'error'
            message = `${field.previousElementSibling.innerText} cannot be blank`
        }

        if (field.type === "email") {
            const regex = /\S+@\S+\.\S+/
            if (!regex.test(field.value)) {
                status = 'error'
                message = "Please enter valid email address", "error"
            }
        }

        // Check password length to be more than 8, at least 1 uppercase 1 lowercase 1 number and 1 symbole
        if (field.type === "password") {
            const regex = /^((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_])).{8,}$/
            if (!regex.test(field.value)) {
                status = 'error'
                message = "Please enter more than 8 characters containing at least 1 uppercase, 1 lowercase, 1 number and 1 symbole."
            }
        }

        if (field.id === "password_confirmation") {
            const passwordField = this.form.querySelector('#password')

            if (field.value.trim() == "") {
                status = 'error'
                message = "Password confirmation required"
            } else if (field.value != passwordField.value) {
                status = 'error'
                message = "Password does not match"
            }
        }

        this.setStatus(field, message, status);
        return status === 'success'
    }

    /**
     * Sets status message and color on the field
     * @param {HTMLElement} field 
     * @param {string} message 
     * @param {string} status 
     */
    setStatus(field, message, status) {
        const errorMessage = field.parentElement.querySelector('.error-message')
        if (field.parentElement.querySelector('.icon')) {
            field.parentElement.querySelector('.icon').remove()
        }

        if (status === 'success') {
            if (errorMessage) { errorMessage.innerText = "" }
            errorMessage.after(this.renderIcon('icon-success'))
        }

        if (status === 'error') {
            errorMessage.innerText = message;
            errorMessage.after(this.renderIcon('icon-error'))
        }
    }

    /**
     * Renders icon element for given type
     * @param {string} iconType 
     * @returns HTMLElement
     */
    renderIcon(iconType = 'icon-error') {
        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const iconPath = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path'
        )

        iconSvg.setAttribute('fill', 'currentColor')
        iconSvg.setAttribute('viewBox', '0 0 20 20')
        iconSvg.setAttribute('stroke', 'white')
        iconSvg.classList.add('icon', iconType)

        iconPath.setAttribute(
            'd',
            iconType === 'icon-error' ?
                'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' :
                'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
        )
        iconPath.setAttribute('fill-rule', 'evenodd')
        iconPath.setAttribute('clip-rule', 'evenodd')

        iconSvg.appendChild(iconPath)
        return iconSvg
    }

    /**
     * Send form data using fetch
     */
    sendFormData() {
        const formData = new FormData(this.form)
        const plainFormData = Object.fromEntries(formData.entries())
        const formDataJsonString = JSON.stringify(plainFormData)

        this.startLoading()

        fetch(this.form.action, {
            body: formDataJsonString,
            method: this.form.method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        })
            .then((response) => response.json())
            .then((data) => {
                this.showResult(data)
            })
            .catch((err) => {
                const data = { success: false, errors: [{ msg: err.message }] }
                this.showResult(data)
            })
    }

    /**
     * Open modal to show result of form submision
     */
    showResult(data) {
        const self = this
        const modal = document.getElementById('modal-one')
        const modalContainer = modal.querySelector('.modal-container')

        const exitButton = document.createElement('button')
        exitButton.classList.add('modal-close', 'modal-exit')
        exitButton.innerHTML = 'X'
        modalContainer.appendChild(exitButton)

        const { success, errors } = data || {}

        if (!success && errors) {
            const title = document.createElement('h2')
            const titleText = document.createTextNode("Failed to submit!")
            title.appendChild(titleText)
            title.classList.add('modal-error')
            modalContainer.appendChild(title)

            errors.forEach(err => {
                const errMsgElement = document.createElement('h3')
                const errMsgText = document.createTextNode(err.msg)
                errMsgElement.appendChild(errMsgText)
                modalContainer.appendChild(errMsgElement)
            })
        } else {
            const title = document.createElement('h2')
            const titleText = document.createTextNode("Form submitted successfully")
            title.appendChild(titleText)
            modalContainer.appendChild(title)
            self.cleanupForm()
        }

        modal.classList.add('open')
        self.stopLoading()
        const exits = modal.querySelectorAll('.modal-exit')
        exits.forEach(function (exit) {
            exit.addEventListener('click', function (event) {
                event.preventDefault()
                modal.classList.remove('open')
                while (modalContainer.firstChild) {
                    modalContainer.removeChild(modalContainer.firstChild);
                }
                //window.location = window.location.href
            })
        });
    }

    /**
     * Disables a button and sets the name as Sending...
     */
    startLoading() {
        const btn = this.form.querySelector('button')
        this.buttonName = btn.innerHTML
        btn.innerHTML = 'Sending...'
        btn.disabled = true
    }

    /**
     * Enable button and restore original name of button
     */
    stopLoading() {
        const btn = this.form.querySelector('button')
        btn.innerHTML = this.buttonName
        btn.disabled = false
    }

    /**
     * Cleans up form data
     */
    cleanupForm() {
        this.fields.forEach(field => {
            const input = document.querySelector(`#${field}`)
            input.value = ''
        })
    }
}
