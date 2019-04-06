const icons = {false: "icons/icon16grey.png", true: "icons/icon16.png"};

// on first run, initialise extension to enabled
chrome.storage.sync.get(["enabled"], function (result)
{
	if (result.enabled === undefined)
		chrome.storage.sync.set({enabled: true});
});

function seticon(id, cb)
{
	chrome.storage.sync.get(["enabled"], function(result)
	{
		chrome.pageAction.setIcon({tabId: id, path: icons[result.enabled]}, cb);
	});
}

// Show page action where enabled
chrome.tabs.onUpdated.addListener(function (id)
{
	chrome.pageAction.show(id);
	seticon(id);
});

// allow toggle
chrome.pageAction.onClicked.addListener(function ()
{
	chrome.storage.sync.get(["enabled"], function (result)
	{
		let val = !result.enabled;
		chrome.storage.sync.set({enabled: val}, function ()
		{
			chrome.tabs.query({}, function (results)
			{
				for (let tab of results)
				{
					// This will only work for tabs we are allowed to
					// run code on, so non-Twitter tabs will be skipped.
					// The callbacks just catch the permissions
					// error in case it happened.
					seticon(tab.id, () => chrome.runtime.lastError);
					chrome.tabs.executeScript(tab.id, {code: `document.body.dispatchEvent(new Event('guaym${val}'));`}, () => chrome.runtime.lastError);
				}
			});
		});
	});
});

console.log("background page finished.");
