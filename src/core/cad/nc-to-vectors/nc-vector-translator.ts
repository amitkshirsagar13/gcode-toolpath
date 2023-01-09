class Toolpath {

    constructor(options) {
        const {
            position,
            modal,
            addLine = noop,
            addArcCurve = noop
        } = { ...options };

        this.g92offset.x = 0;
        this.g92offset.y = 0;
        this.g92offset.z = 0;

        // Position
        if (position) {
            const { x, y, z } = { ...position };
            this.setPosition(x, y, z);
        }

        // Modal
        const nextModal = {};
        Object.keys({ ...modal }).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(this.modal, key)) {
                return;
            }
            nextModal[key] = modal[key];
        });
        this.setModal(nextModal);

        this.fn = { addLine, addArcCurve };

        const toolpath = new Interpreter({ handlers: this.handlers });
        toolpath.getPosition = () => ({ ...this.position });
        toolpath.getModal = () => ({ ...this.modal });
        toolpath.setPosition = (...pos) => {
            return this.setPosition(...pos);
        };
        toolpath.setModal = (modal) => {
            return this.setModal(modal);
        };

        return toolpath;
    }
}

export default Toolpath;
