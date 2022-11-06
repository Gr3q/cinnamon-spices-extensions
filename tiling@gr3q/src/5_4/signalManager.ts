
export class SignalManager {
    private connectedSignals: Map<imports.gi.GObject.Object, number[]> = new Map();

    public Connect<T extends imports.gi.GObject.Object>(object: T, signal: number) {
        if (!this.connectedSignals.has(object))
            this.connectedSignals.set(object, []);

        this.connectedSignals.get(object)!.push(signal);
    }

    public Disconnect(object: imports.gi.GObject.Object, signal: number) {
        if (!this.connectedSignals.has(object))
            return;

        const signals = this.connectedSignals.get(object)!;
        const signalIndex = signals.findIndex((v => v == signal));
        if (signalIndex == -1)
            return;

        signals.splice(signalIndex, 1);
        object.disconnect(signal);
    }

    public Destroy() {
        for (const [object, signals] of this.connectedSignals) {
            for (const signal of signals) {
                object.disconnect(signal);
            }
        }
    }
}