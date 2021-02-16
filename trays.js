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
        if (element instanceof Element) {
            if (Trays._empty(element.id)) {
                throw new TraysElementException('Element must have id.');
            } else {
                this.domElement = element;
                element = undefined;
                this.id = this.domElement.id;
                this.enumerateChildren(this.domElement);
            }
            
        } else {
            throw new TraysDOMException('The object is not an instance of Element.');
        }
    }

    static classMap = {
        'open': (child)=>{child.parent.active[child.id]=child}
    };

    static hashMap = {
        '+': (tray)=>{tray.open&&tray.open()},
        '-': (tray)=>{tray.close&&tray.close()},
        '~': (tray)=>{tray.toggle&&tray.toggle()}
    };

    isFullscreen = false;

    static load() {
        var traysCol = {};
        var traysElements = document.querySelectorAll('.trays');
        for (const traysElement of traysElements) {
            var traysObject = new Trays(traysElement);
            if (traysCol[traysObject.id]) {
                throw new TraysDuplicateException('Trays "' + traysObject.id + '" already exists in the tray collection.')
            } else {
                traysCol[traysObject.id] = traysObject;
            }
        }
        window.addEventListener('hashchange', function(){Trays.hash(traysCol)});
        return traysCol;
    }

    static hash(g) {
        var h = window.location.hash;
        if ((h = h.slice(1)).slice(0, 2) == '::') {
            h = h.slice(2);
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
        window.location.hash = '';
    }

    static _empty(obj) {
        return (obj.toString().trim() === '' || obj === null || obj === undefined);
    }

    enumerateChildren() {
        this.children = {};
        this.active = {};
        for (const child of this.domElement.children) {
            if (child.classList && child.classList.contains('tray')) {
                if (Trays._empty(child.id)) {
                    throw new TraysDOMException('Element must have id.');
                } else if (this.children[child.id]) {
                    throw new TraysDuplicateException('Tray "' + child.id + '" already exists in Trays object "' + this.id + "'.");
                } else {
                    var tray = new Tray(child, this);
                    this.children[child.id] = tray;
                    child.classList.forEach((x)=>{Trays.classMap[x]&&Trays.classMap[x](tray)}, this)
                }
            } else {
                child.remove();
            }
        }
    }
        
    clear() {
        this.domElement.innerHTML = '';
        this.enumerateChildren();
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
            throw new TraysParentException('The parent object must be an instance of Trays.');
        } else if (element instanceof Element) {
            this.domElement = element;
            this.id = element.id;
            this.parent = parent;
        } else {
            throw new TraysElementException('The object is not an instance of Element.');
        }
    }
    open() {
        !this.parent.active[this.id] && (this.parent.active[this.id] = this, this.domElement.classList.add('open'));
    }
    close() {
        this.parent.active[this.id] && (delete this.parent.active[this.id], this.domElement.classList.remove('open'));
    }
    toggle() {
        this.parent.active[this.id] ? this.close() : this.open();
    }
    remove() {
        delete this.parent.children[this.id];
        delete this.parent.active[this.id];
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