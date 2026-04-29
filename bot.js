const { default: makeWASocket, useMultiFileAuthState, Browsers } = require("@whiskeysockets/baileys")
const pino = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info")
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.windows('Chrome')
    })

    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER
        if (!phoneNumber) return console.log("ضيف رقمك في Environment")
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`\n✅ كود الربط: ${code}`)
        console.log("واتساب > الأجهزة المرتبطة > ربط برقم الهاتف\n")
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        const command = body.slice(1).trim().split(' ')[0].toLowerCase()
        const args = body.trim().split(/ +/).slice(1)

        if (!body.startsWith('.')) return

        // Check if sender is admin in group
        let isAdmin = false
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(from)
            const sender = m.key.participant
            isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin!== null
        }

        //.menu command - شغال لل
