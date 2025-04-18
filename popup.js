document.addEventListener('DOMContentLoaded', function () {
    const now = new Date();
    const localTimeString = now.getFullYear() + '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
        ('0' + now.getDate()).slice(-2) + 'T' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2);

    const datetimeLocal = document.getElementById('timeSlot');
    datetimeLocal.value = localTimeString;

    displayScheduledNotes();

    document.getElementById('scheduleButton').addEventListener('click', function () {
        const selectedTime = document.getElementById('timeSlot').value;
        const noteContent = document.getElementById('noteContent').value.trim();

        if (noteContent) {
            const selectedTimeDate = new Date(selectedTime);
            const selectedTimeInMillis = selectedTimeDate.getTime();

            const newNote = { content: noteContent, scheduledAt: selectedTimeInMillis };
            chrome.storage.local.get('scheduledNotes', (result) => {
                let notes = result.scheduledNotes || [];
                notes.push(newNote);
                chrome.storage.local.set({ scheduledNotes: notes }, () => {
                    displayScheduledNotes();
                    showSuccess();
                    resetState(localTimeString);
                });
            });


        }
    });

    function resetState(localTimeString) {
        document.getElementById('noteContent').value = '';
        datetimeLocal.value = localTimeString;
    }

    function displayScheduledNotes() {
        const notesList = document.getElementById('scheduledNotes');
        chrome.storage.local.get('scheduledNotes', (result) => {
            const notes = result.scheduledNotes || [];
            notesList.innerHTML = '';

            notes.forEach((note, index) => {
                const li = document.createElement('li');
                const formattedTime = formatDateTime(note.scheduledAt);
                const previewContent = note.content.length > 30 ? note.content.slice(0, 30) + '...' : note.content;
                li.classList.add('note-item');
                li.innerHTML = `
                    <span>${previewContent}</span>
                    <span class="scheduled-time">${formattedTime}</span>
                    <button data-index="${index}">Delete</button>
                `;
                notesList.appendChild(li);
            });

            const deleteButtons = notesList.querySelectorAll('button');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const noteIndex = parseInt(this.dataset.index);
                    deleteNoteFromStorage(noteIndex);
                });
            });
        });
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const options = {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
        };
        return date.toLocaleDateString('en-US', options);
    }

    function deleteNoteFromStorage(index) {
        chrome.storage.local.get('scheduledNotes', (result) => {
            let notes = result.scheduledNotes || [];
            notes.splice(index, 1);
            chrome.storage.local.set({ scheduledNotes: notes });
            displayScheduledNotes();
        });
    }

    function showSuccess() {
        const button = document.getElementById('scheduleButton');
        button.textContent = 'Scheduled!';

        button.classList.add('success');

        setTimeout(() => {
            button.textContent = 'Schedule note';
            button.classList.remove('success');
        }, 2000);
    }


    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'block';
        errorMessage.textContent = message;

        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});
