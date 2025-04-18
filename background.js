chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checkScheduledNotes', {
    periodInMinutes: 1,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkScheduledNotes') {
    checkAndSendStaleNotes();
  }
});

function checkAndSendStaleNotes() {
  chrome.storage.local.get('scheduledNotes', (result) => {
    const notes = result.scheduledNotes || [];
    const now = Date.now();
    const notesToSend = notes.filter(note => note.scheduledAt <= now);

    if (notesToSend.length > 0) {
      notesToSend.forEach(note => send(note.content));
      removeSentNotes(notesToSend, notes);
    }
  });
}

function send(content) {
  chrome.cookies.get({ url: 'https://substack.com', name: 'substack.sid' }, function (cookie) {
    substackFormatContent = prepareContent(content);
    if (cookie) {
      const postData = {
        bodyJson: {
          type: "doc",
          attrs: { schemaVersion: "v1" },
          content: substackFormatContent,
        },
        tabId: "for-you",
        surface: "feed",
        replyMinimumRole: "everyone"
      };

      fetch("https://substack.com/api/v1/comment/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `substack.sid=${cookie.value}`
        },
        body: JSON.stringify(postData)
      })
        .then(response => response.json())
        .then(data => console.log("Note sent (bg):", data))
        .catch(error => console.error("Error sending note (bg):", error));
    } else {
      console.error("substack.sid cookie not found (bg).");
    }
  });
}

function removeSentNotes(sentNotes, allNotes) {
  const remainingNotes = allNotes.filter(note =>
    !sentNotes.find(sent => sent.scheduledAt === note.scheduledAt)
  );

  chrome.storage.local.set({ scheduledNotes: remainingNotes });
}

function prepareContent(content) {
    results = []
    content.split('\n').forEach(function(paragraph){
        results.push({ type: "paragraph", content: [{ type: "text", text: paragraph }] })
    });
    return results
}