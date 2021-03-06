//-------------------------------------------------------------
// Classes -- WARNING!! REFACTORING ZONE!! TOO MUCH WET CODE!!
//-------------------------------------------------------------

class FileController {
    constructor() {
        this.delay = 200
        this.clicks = 0
        this.timer = null
        this.target = null
        this.selectionOneClickTimer = null
    }

    resetFields() {
        this.clicks = 0
        clearTimeout(this.timer)
    }

    async selectFile(node) {
        $('body').click()
        data.switches.selectedFile = true
        node.classList.add('desktopFileActive')
    
        await wait(50)
        data.switches.selectedFile = false
    }

    selectNewTarget(targetApp) {
        this.clicks++
        this.selectFile(targetApp)
        this.target = targetApp
        this.timer = setTimeout(() => {
            this.resetFields()
        }, this.delay)
    }

    fileClick(targetApp) {
        if (this.clicks === 0) {
            this.selectNewTarget(targetApp)
        } else if (targetApp === this.target) {
            clearTimeout(this.timer)
            $('body').click()
            data.windowsController.open(targetApp.dataset.openApp)
            this.resetFields()
        } else {
            clearTimeout(this.timer)
            this.resetFields()
            this.selectNewTarget(targetApp)
        }
    }

    openNewTarget(targetApp) {
        this.clicks++
        this.target = targetApp
        this.timer = setTimeout(() => {
            data.windowsController.open(targetApp.dataset.openApp)
            this.resetFields()
        }, this.delay)
    }

    fileOpen(targetApp) {
        if (this.clicks === 0) {
            this.openNewTarget(targetApp)
        } else if (targetApp === this.target) {
            clearTimeout(this.timer)
            this.selectFile(targetApp)
            this.resetFields()
        } else {
            clearTimeout(this.timer)
            this.resetFields()
            this.openNewTarget(targetApp)
        }
    }
}

class Grid {

    constructor() {
        this.desktop = find('.desktop')
        this.filesize = find('.desktopFile')

        this.fileOffsetX = 10;
        this.fileOffsetY = 5;

        //calculation grid size with considering offsets
        this.width = Math.floor(this.desktop.offsetWidth / (this.filesize.offsetWidth + this.fileOffsetX))
        this.height = Math.floor(this.desktop.offsetHeight / (this.filesize.offsetHeight + this.fileOffsetY))

        //indents from screen boundaries. Using remainder after division of expression above
        this.screenOffsetX = (this.desktop.offsetWidth % (this.filesize.offsetWidth + this.fileOffsetX))
        this.screenOffsetY = (this.desktop.offsetHeight % (this.filesize.offsetHeight + this.fileOffsetY))
        
        // console.log(this.width, this.height)
        this.data = new Array(this.width * this.height)
        for (let i = 0; i < this.data.length; i++) {
            /** 
            * In one-dimentional array X always represents as "X mod width" due to looping 0-width values.
            * Y represents as float value until reached "width", thus on every row it's increments.
            */
            let x = ((i % this.width) * this.filesize.offsetWidth) + (this.screenOffsetX / 2) + ((i % this.width) * this.fileOffsetX) + this.fileOffsetX
            let y = Math.floor(i / this.width) * this.filesize.offsetHeight + (this.screenOffsetY / 2) + (Math.floor(i / this.width) * this.fileOffsetY) + this.fileOffsetY
            this.data[i] = { posX: x, posY: y, occupied: false, i: i }
            // createNewFile(y, x, i + 1, this.desktop)
        }

        for (const node of findAll('.desktopFile')) {
            const posOnGrid = this.nodeFromPoint(node.offsetLeft, node.offsetTop)
            this.setOccupied(posOnGrid)
            node.style.top = vh(posOnGrid.posY)
            node.style.left = vw(posOnGrid.posX)
        }
    }

    checkCoordinates(x, y) {
        let clampedX = x
        let clampedY = y
        if (clampedX + this.filesize.offsetWidth > this.desktop.offsetWidth) clampedX = this.desktop.offsetWidth
        if (clampedY + this.filesize.offsetHeight > this.desktop.offsetHeight) clampedY = this.desktop.offsetHeight
        return [clampedX, clampedY]
    }

    nodeFromPoint(x, y) {
        let vec2 = [x, y]
        vec2 = this.checkCoordinates(vec2[0], vec2[1])
        
        let arrayX = Math.floor(vec2[0] / (this.filesize.offsetWidth + this.fileOffsetX))
        let arrayY = Math.floor(vec2[1] / (this.filesize.offsetHeight + this.fileOffsetY))

        return this.data[arrayX + arrayY * this.width]
    }

    setOccupied(node) {
        this.data[node.i].occupied = true
    }

    setUnoccupied(node) {
        this.data[node.i].occupied = false
    }
}

function createNewFile (top, left, name, desktop) {
    const desktopFile = document.createElement('div')
    desktopFile.classList.add('desktopFile')
    desktopFile.addStyle('top', calculateRelativeUnits(top, 'vh'))
    desktopFile.addStyle('left', calculateRelativeUnits(left, 'vw'))

    const desktopFileIcon = document.createElement('i')
    desktopFileIcon.classList.add('desktopFileIcon', 'fas', 'fa-file-alt')

    const desktopFileTitle = document.createElement('div')
    desktopFileTitle.classList.add('desktopFileTitle')
    desktopFileTitle.textContent = name

    desktopFile.appendChild(desktopFileIcon)
    desktopFile.appendChild(desktopFileTitle)
    desktop.appendChild(desktopFile)
}

class SelectionBox {
    constructor() {
        this.target = find('.selectionBox')
        this.top = null
        this.left = null
    }

    start(pageY, pageX) {
        this.top = pageY
        this.left = pageX
    }

    end() {
        this.top = null
        this.left = null
        $(this.target).removeAttr('style')
    }

    resize(pageY, pageX) {
        this.target.addStyle('display', 'block')

        let top = this.top
        let left = this.left 
        let height = pageY - this.top
        let width = pageX - this.left

        if (height == 0 || width == 0) this.target.addStyle('display', 'none')
        if (height < 0) {height = Math.abs(height); top = this.top - height}
        if (width < 0) {width = Math.abs(width); left = this.left - width}

        this.target
            .addStyle('top', top + 'px')
            .addStyle('left', left + 'px')
            .addStyle('height', height + 'px')
            .addStyle('width', width + 'px')
    }
}

class DropdownController {
    constructor() {
        this.dropdown = null
        this.parent = null
        this.hoverMode = false
        this.close = false
    }

    checkOverflow(left) {
        if (left + this.dropdown.offsetWidth > window.innerWidth) {
            left -= ((left + this.dropdown.offsetWidth) - window.innerWidth)
        } else if (left < 0) { left = 0 }
        return left
    }

    click(parent, dropdown) {
        if (this.dropdown == dropdown && this.parent == parent) { this.hide(true); return }
        if (this.dropdown !== null) this.hide()

        this.dropdown = dropdown
        this.parent = parent
        this.hoverMode = true
        this.show()
    }

    async show() {
        this.dropdown.classList.add('dropdownActive')
        this.parent.classList.add('taskbarElementActive')

        let top = find('.taskbar').getBoundingClientRect().bottom + 'px'
        let left

        switch (this.parent.dataset.dropdownAlign) {
            case 'left':
                left = this.checkOverflow(this.parent.getBoundingClientRect().left)
                break

            case 'center': 
                left = this.checkOverflow(this.parent.offsetLeft + (this.parent.offsetWidth - this.dropdown.offsetWidth) / 2)
                break

            case 'right':
                left = this.checkOverflow(this.parent.getBoundingClientRect().right)
                break
        }

        this.dropdown
            .addStyle('left', vw(left))
            .addStyle('top', vh(top))

        await wait(50)
        this.close = true
    }

    hide(force) {
        if (force) {
            for (const dropdown of findAll('[data-dropdown].dropdownActive')) {
                dropdown.classList.remove('dropdownActive')
            }
            for (const dropdown of findAll('.taskbarElementActive')) {
                dropdown.classList.remove('taskbarElementActive')
            }
        } else {
            this.dropdown.classList.remove('dropdownActive')
            this.parent.classList.remove('taskbarElementActive')
        }
        
        this.dropdown = null
        this.parent = null
        if (force) {
            this.hoverMode = false
            this.close = false
        }
    }

    hover(parent, dropdown) {
        this.hide()

        this.dropdown = dropdown
        this.parent = parent
        this.show()
    }
}

class ContextmenuController {
    constructor() {
        this.node = find('.ctxm')
        this.clicked = false

        this.types = {
            'file': [
                {icon: 'fas fa-hammer', key: 'kekw'},
                {separator: true},
                {icon: 'fas fa-hammer', key: 'idk'}
            ]
        }
    }

    async click(event) {
        if (this.clicked) return
        this.clicked = true

        this.hide()
        this.build(event.currentTarget.dataset.ctxmType)
        
        this.node
            .addStyle('display', 'flex')
            .addStyle('top', vh(event.pageY))
            .addStyle('left', vw(event.pageX))

        await wait(50)
        this.clicked = false
    }

    build(ctxmType) {
        for (const item of this.types[ctxmType]) {
            const Node = document.createElement('a')

            for (const [key, value] of Object.entries(item)) {
                switch (key) {
                    case 'separator':
                        Node.classList.add('dropdown-separator')
                        break

                    case 'icon': 
                        const Icon = document.createElement('i')
                        Icon.classList.value = value

                        Node.appendChild(Icon)
                        Node.classList.add('ctxm-item')
                        break

                    case 'key':
                        const Text = document.createElement('p')
                        Text.textContent = value

                        Node.appendChild(Text)
                        Node.classList.add('ctxm-item')
                        break
                }
            }

            this.node.appendChild(Node)
        }
    }

    hide() {
        $(this.node).removeAttr('style')
        this.node.replaceChildren()
    }
}

class WindowsController {
    constructor() {
        this.place = find('#windows')
        this.ltaskbar = find('.lowerTaskbar')

        this.winID = null
    }

    open(winID) {
        this.winID = winID

        const node = this.build()
        if (!node) return false

        this.spawn(node)
    }

    build() {
        if (!windows.hasOwnProperty(this.winID)) return
        const dataWin = windows[this.winID]
        if(dataWin.once && find(`[data-app-id="${this.winID}"]`)) return

        const html = `
        <div class="window" id="${genID()}" data-app-id="${this.winID}">
            <div class="windowNavbar" data-handler>
                <div class="windowTitle">${translate(dataWin.title)}</div>
                <div class="windowButtons">
                    <div class="windowButton buttonMinimize"></div>
                    <div class="windowButton buttonMaximize"></div>
                    <div class="windowButton buttonClose"></div>
                </div>
            </div>
            <div class="windowContent">${dataWin.html}</div>
        </div>`
        
        return stringToElement(html)
    }

    spawn(node) {
        const dataWin = windows[this.winID]
        node
            .addStyle('display', 'flex')
            .addStyle('height', dataWin.minHeight + 'px')
            .addStyle('width', dataWin.minWidth + 'px')

        this.place.appendChild(node)

        $(node).draggable({
            cursor: 'default',
            cancel: '.windowTitleButtons',
            handle: 'div[data-handler]'
        })
        .resizable({
            handles: 'all',
            maxHeight: dataWin.maxHeight,
            maxWidth: dataWin.maxWidth,
            minHeight: dataWin.minHeight,
            minWidth: dataWin.minWidth,
        })

        $(`#${node.id} .buttonClose`).click((event) => {
            this.place.removeChild(node)
            $(`#${node.id} .buttonClose`).off()
        })
    }
}