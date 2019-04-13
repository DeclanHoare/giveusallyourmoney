const msg = "GIVE US ALL YOUR MONEY";
var changed = [];

// Like querySelectorAll, but includes the root node if it matches the
// selector.
function query(elem, selector)
{
	if (!(elem instanceof Element))
		return [];
	let ret = Array.from(elem.querySelectorAll(selector));
	if (elem.matches(selector))
		ret.unshift(elem);
	return ret;
}

fetch(chrome.runtime.getURL("data/brands.txt")).then(resp => resp.text().then(function (raw)
{
	let brands = raw.split("\n");
	
	function changetweet(elem)
	{
		// Don't save an element that's already been changed, or it
		// won't be reverted correctly if the user disables the
		// extension.  If a brand happens to tweet the message, it
		// won't make any difference whether we changed it or not
		// anyway.
		if (elem.innerHTML === msg)
			return;
		changed.push([elem, elem.innerHTML]);
		elem.innerHTML = msg;
	}
	
	function changetree(root)
	{
		chrome.storage.sync.get(["enabled"], function (result)
		{
			if (!result.enabled)
				return;
			
			// Old Twitter
			query(root, ".tweet, .QuoteTweet-innerContainer").forEach(function (tweet)
			{
				if (tweet.dataset.screenName !== undefined && brands.includes(tweet.dataset.screenName.toLowerCase()))
					changetweet(tweet.querySelector(".tweet-text"));
			});
			
			// New Twitter
			query(root, "article").forEach(function (tweet)
			{
				tweet.querySelectorAll("a").forEach(function (link)
				{
					if (link.querySelector("img[src*='profile_images']") !== null)
					{
						// This is the author's profile picture, so the href
						// must contain the handle.  Remove / to get it.
						if (brands.includes(link.getAttribute("href").replace(/\//g, "").toLowerCase()))
							changetweet(tweet.querySelector("div[lang]"));
					}
				});
			});
		});
	}
	
	function changepage()
	{
		changetree(document.body);
	}
	
	function undo()
	{
		for (let [elem, text] of changed)
		{
			elem.innerHTML = text;
		}
		changed = [];
	}
	
	changepage();
	let observer = new MutationObserver(function (records)
	{
		for (let record of records)
		{
			switch (record.type)
			{
				case "childList":
					record.addedNodes.forEach(changetree);
					break;
				case "attributes":
					changetree(record.target);
					break;
			}
		}
	});
	observer.observe(document.body, {childList: true, subtree: true, attributes: true});
	
	// One of these events is fired when the extension is toggled
	document.body.addEventListener("guaymtrue", changepage);
	document.body.addEventListener("guaymfalse", undo);
}));
