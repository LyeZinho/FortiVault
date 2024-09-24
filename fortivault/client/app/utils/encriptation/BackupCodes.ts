import crypto from 'crypto';

class BackupCodes {
    private initializers: string;

    constructor(initializerimput?: string) {
        this.initializers = initializerimput || "";
    }

    setupInitializers(){
        this.initializers = this.generateInitializers();
    }

    getInitializers(){
        return this.initializers;
    }

    generateInitializers(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[{]}|;:,.<>?/~`';
        let result = '';
        for (let i = 0; i < 18; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    generateInitialGroups(): string[] {
        const groups = [];
        for (let i = 0; i < 3; i++) {
            groups.push(this.initializers.substr(i * 6, 6));
        }
        return groups;
    }

    generateInitialSubgroups(initialGroups: string[]): object{
        const subgroups: { [key: number]: { [key: number]: string } } = {};
        for (let i = 1; i <= 3; i++) {
            subgroups[i] = {};
            for (let j = 1; j <= 3; j++) {
                subgroups[i][j] = crypto.createHash('sha512').update(this.initializers).digest('hex');
            }
        }
        return subgroups;
    }

    generateGroupEncripted(subgroups: { [key: number]: { [key: number]: string } }): object {
        const groups: { [key: number]: string } = {};
        for (let i = 1; i <= 3; i++) {
            let group = '';
            for (let j = 1; j <= 3; j++) {
                group += subgroups[j][i];
            }
            groups[i] = crypto.createHash('sha256').update(group).digest('hex');
        }
        return groups;
    }

    generateIv(key: string): Buffer {
        const keyBuffer = Buffer.from(key.slice(0, 20), 'hex');
        return crypto.createHash('sha256').update(keyBuffer).digest().slice(0, 16);
    }

    generateEncriptarionKey(encriptedgroups: {[key: string]: string}): { key: string, iv: Buffer} {
        const key = crypto.createHash('sha512').update(this.initializers).digest('hex');
        const iv = this.generateIv(key);
        return { key, iv };
    }
}

export default BackupCodes;