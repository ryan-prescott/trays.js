class TraysDOMException extends Error {
    constructor(message) {
        super(message);
        this.name='TraysElementException';
    }
}

class TraysDuplicateException extends Error {
    constructor(message) {
        super(message);
        this.name='TrayElementException';
    }
}

class TraysParentException extends Error {
    constructor(message) {
        super(message);
        this.name='TraysParentException';
    }
}


class Trays {
    constructor(element) {
        if (!element instanceof Element) {
            throw new TraysDOMException('The object is not an instance of Element.');
        } else if (!element?.classList.contains('trays')) {
            throw new TraysDOMException('Element must have "trays" class.');
        } else if (Trays._empty(element.id)) {
            throw new TraysDOMException('Element must have id.');
        } else {
            this.domElement = element;
            this.id = element.id;
            this.isFullscreen = false;
            this.enumerateChildren();
        }
    }

    static hashMap = {
        '+': (tray)=>{tray?.open()},
        '-': (tray)=>{tray?.close()},
        '~': (tray)=>{tray?.toggle()}
    };

    static classMap = {
        'open': (tray)=>{tray?.open()}
    };

    static load() {
        var traysCol = {};
        var traysElements = document.querySelectorAll('.trays');
        for (const traysElement of traysElements) {
            var traysObject = new Trays(traysElement);
            if (traysCol[traysObject.id]) {
                throw new TraysDuplicateException('Trays "' + traysObject.id + '" already exists in the tray collection.');
            } else {
                traysCol[traysObject.id] = traysObject;
            }
        }
        window.addEventListener('hashchange', function(){Trays.hash(traysCol)});
        return traysCol;
    }

    static hash(g) {
        var h = window.location.hash;
        if (h.slice(0, 3) === '#::') {
            h = h.slice(3);
            var i = Object.keys(g), j = h.split('$'), k = g[j[0]] || g[i[j[0]]] || g[i[0]] || null;
            if (k !== null) {
                var l = j[j.length === 1 ? 0 : 1].split('|');
                for(const n of l) {
                    var o = n.slice(0, 1), p = n.slice(1).split(',');
                    for(const q of p) {
                        Trays.hashMap[o]&&Trays.hashMap[o](k.children[q]||null);
                    }
                }
            }
        }
    }

    static _empty(obj) {
        return (obj.toString().trim() === '' || obj === null || obj === undefined);
    }

    enumerateChildren() {
        this.children = {};
        this.open = {};
        var childArray = Array.from(this.children);
        for (const child of this.domElement.children) {
            var tray = new Tray(child, this);
            if (childArray.includes(tray)) {
                throw new TraysDuplicateException('Tray "' + tray.id + '" already exists in Trays object "' + this.id + "'.");
            } else {
                this.children[tray.id] = tray;
            }
        }
    }
        
    clear() {
        this.domElement.innerHTML = '';
        this.enumerateChildren();
    }

    next() {
        // Get the next inactive child through convoluted means
        var x = this.children[Object.keys(this.children).filter(x => !Object.keys(this.open).includes(x))[0]];
        return x?.open() ? true : false;
    }

    previous() {
        // Get the currently active child through less convoluted means
        var x = this.open[Object.keys(this.open).slice(-1)];
        return x?.close() ? true : false;
    }

    fullscreen() {
        this.domElement.classList.toggle('fullscreen');
        this.isFullscreen = !this.isFullscreen;
        if (this.isFullscreen) {
            this.domElement.style.removeProperty('width');
            this.domElement.style.removeProperty('height');
        } else {
            this._width && this._height && this.resize();
        }
    }

    resize(width = this._width, height = this._height, unit = 'px') {
        if (this.isFullscreen) {
            this.fullscreen();
        }
        width!==this._width && (this._width = parseFloat(width));
        height!==this._height && (this._height = parseFloat(height));
        this.domElement.style.width = this._width.toString() + unit.toString();
        this.domElement.style.height = this._height.toString() + unit.toString();
    }

}

class Tray {
    constructor(element, parent) {
        if (!parent instanceof Trays) {
            throw new TraysParentException('The parent must be a Trays object.');
        } else if (!element instanceof Element) {
            throw new TraysDOMException('The object is not an instance of Element.');
        } else if (!element?.classList.contains('tray')) {
            throw new TraysDOMException('Element must have "tray" class.');
        } else if (Trays._empty(element.id)) {
            throw new TraysDOMException('Element must have id.');
        } else {
            this.domElement = element;
            this.id = element.id;
            this.parent = parent;
            for(const className of this.domElement.classList) {
                Trays.classMap[className]&&Trays.classMap[className](this);
            }
        }
    }
    get isOpen() {
        return this.parent.open[this.id] ? true: false;
    }
    open() {
        return !this.isOpen && (this.parent.open[this.id] = this, this.domElement.classList.add('open')) || true;
    }
    close() {
        return this.isOpen && (delete this.parent.open[this.id], this.domElement.classList.remove('open')) || true;
    }
    toggle() {
        return this.isOpen ? this.close() : this.open();
    }
    remove() {
        delete this.parent.children[this.id];
        delete this.parent.open[this.id];
        this.domElement.remove();
    }
    direction(s) {
        var directions = ['top', 'left', 'right', 'bottom'];
        if(directions.includes(s)) {
            this.domElement.classList.remove(...directions);
            this.domElement.classList.add(s);
        }
    }
}