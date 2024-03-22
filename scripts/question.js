import { db } from "./firebase.js"
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"
import { updateDoc, getDocs, doc, orderBy, query, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"


document.querySelector('#send-button').addEventListener('click', startingSend)
const resultUI = document.querySelector('.confirm-background')

function startingSend() {
    resultUI.querySelector('p').innerHTML = "caricamento..."
    resultUI.querySelector('img').src = "assets/hourglass.svg"
    resultUI.querySelector('img').classList.add("hourglass")
    resultUI.classList.add("open")
    setTimeout(send, 400)
}

async function send() {
    const value = document.querySelector('#input-text-question').value
    try {
        if (value === "") {
            throw new Error("La domanda è vuota")
        }
        if (value.length < 10) {
            throw new Error("Troppi pochi caratteri")
        }

        const ipAddress = await getIpAddress()

        const blackListValues = await blackList(ipAddress)

        const idList = blackListValues.id
        let blockedList
        let countList
        if (idList != null) {
            blockedList = blackListValues.data().blocked
            countList = blackListValues.data().count
        } else {
            blockedList = blackListValues.blocked
            countList = blackListValues.count
        }

        if (blockedList == true) {
            throw new Error("Sei stato bloccato!")
        }

        let block = false
        block = await blockBadWord(value)
        if (!block && await blockUser(ipAddress, countList, idList)) {
            addDoc(collection(db, "questions"), {
                content: value,
                read: false,
                sender: ipAddress,
                timestamp: Timestamp.now()
            });
        }

        resultUI.querySelector('img').classList.remove("hourglass")
        resultUI.querySelector('p').innerHTML = "Grazie di aver contribuito!"
        resultUI.querySelector('img').src = "assets/correct-icon.svg"
        document.querySelector('#input-text-question').value = ""

        resultUI.classList.add("open")
        setTimeout(() => resultUI.classList.remove("open"), 750)
    } catch (e) {
        console.error("Error adding question: " + e.message);

        resultUI.querySelector('img').classList.remove("hourglass")
        resultUI.querySelector('p').innerHTML = e.message
        resultUI.querySelector('img').src = "assets/wrong-icon.svg"

        resultUI.classList.add("open")
        setTimeout(() => resultUI.classList.remove("open"), 1500)
    }
}

async function blockBadWord(value) {
    let result = false
    await fetch("assets/lista_badwords.txt")
        .then((res) => res.text())
        .then((text) => {
            let checkValue = value.toLowerCase()
            checkValue = checkValue.split(" ").join(" ").split("\n").join(" ").split(" ")
            text = text.split("\n")
            if (text.some(r => checkValue.includes(r))) {
                result = true
            }
        })
        .catch((e) => {
            console.log(e)
            throw new Error("errore nell'invio della domanda")
        });
    return result
}


async function getIpAddress() {
    let ipAddress
    await fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            ipAddress = data.ip
        })
        .catch(error => {
            console.log('Error:', error);
            throw new Error("errore nell'invio della domanda")
        });
    return ipAddress
}

async function blackList(ip) {
    let q = await query(collection(db, "blacklist"), where('user', '==', ip))
    let querySnapshot = await getDocs(q);
    if (querySnapshot.docs[0] == undefined) {
        return { blocked: false, id: null, count: 0 }
    }
    else {
        const minutes = Timestamp.now().seconds / 60 - querySnapshot.docs[0].data().timestamp.seconds / 60
        if (minutes >= (30 * querySnapshot.docs[0].data().count)) {
            const docRef = doc(db, "blacklist", querySnapshot.docs[0].id);
            await updateDoc(docRef, {
                blocked: false,
            });
            q = await query(collection(db, "blacklist"), where('user', '==', ip))
            querySnapshot = await getDocs(q);
        }
        return querySnapshot.docs[0]
    }
}


async function blockUser(ip, numberBlocks, id) {

    const q = await query(collection(db, "questions"), where('sender', '==', ip), orderBy("timestamp"))
    const queryCount = await getCountFromServer(q);
    const querySnapshot = await getDocs(q);

    const numberOfQuestion = queryCount.data().count

    if (numberOfQuestion >= 2 && numberOfQuestion < 5) {

        const secondsDelta = Timestamp.now().seconds - querySnapshot.docs[numberOfQuestion - 1].data().timestamp.seconds
        if (secondsDelta <= 90) {
            throw new Error("Stai facendo troppe domande in poco tempo, aspetta!")
        }
    }
    else if (numberOfQuestion >= 5) {
        const secondsDelta = Timestamp.now().seconds - querySnapshot.docs[numberOfQuestion - 2].data().timestamp.seconds

        if (secondsDelta <= 120) {
            if (numberBlocks === 0) {
                addDoc(collection(db, "blacklist"), {
                    user: ip,
                    count: 1,
                    blocked: true,
                    timestamp: Timestamp.now()
                });
            }
            else {
                const docRef = doc(db, "blacklist", id);
                await updateDoc(docRef, {
                    count: (numberBlocks + 1),
                    blocked: true,
                    timestamp: Timestamp.now()
                });
            }
            const countQuery = await query(collection(db, "blacklist"), where('user', '==', ip))
            const snapshot = await getDocs(countQuery);
            const count = snapshot.docs[0].data().count
            throw new Error("Sei stato bloccato per " + 30 * count + "m")
        }

    }

    return true
}