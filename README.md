# Nautsbuilder

You play Awesomenauts and are tired to navigate on the wiki to try new builds? **Things have changed**. The Nautsbuilder allows you to create and share builds easily, on the web.

# How it works

This JavaScript app is mostly built with Backbone.js. The particular thing is that it gets all its data from **a google spreadsheet** thanks to Tabletop.js.

This allows to quickly and easily change characters attributes and upgrades in case of Awesomenauts patchs.

And thanks to the community, all characters/skills/upgrades data is now in the spreadsheet :)

# Filling the spreadsheet correctly

There are two spreadsheets: one for PC data, one for console data.

PC data is available here https://docs.google.com/spreadsheet/ccc?key=0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc

Console data is available here https://docs.google.com/spreadsheet/ccc?key=0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE

It is pretty simple to fill but there are a few things to know.

* **If you change anything in the spreadsheet, let me know in the [forum](http://www.awesomenauts.com/forum/viewtopic.php?f=14&t=13663)**. A manual update of the Nautsbuilder is required to reflect new data changes.
* There are 3 different sheets: Characters, Skills, and Upgrades. You can switch sheets at the bottom of the screen.
* For every sheet, please **don't put any empty rows or columns**: any row/column after a completely empty row/column would become unavailable by the Nautsbuilder.
* Every `description` field will translate \*sentences like this\* as *sentences in italics like this*.
* To fill everything easily and quickly, find the wiki page of the character you're working on (ie for Leon: http://awesomenauts.wikia.com/wiki/Leon_Chameleon). Almost every info on skills and upgrades are there. From time to time you might need to look at the game or the official website if you want more info.
* Finally if you have trouble, you can see an example of well-formatted data with **Leon Chameleon**, or ping me in the [forum](http://www.awesomenauts.com/forum/viewtopic.php?f=14&t=13663) (Leimi).

## Characters

The Character sheet is easy. `name`, `icon` and `image` fields are required so the app works well, other ones are bonus.

Characters should be listed in the same order as they are in the character selection screen in the game.

## Skills

* Each skill is tied to its character. Binding between the skill and the character is made on the `character` field: be sure to type a name listed in the Characters sheet. Ie, having a Skill tied to "Leon" will not work: the Character is "Leon Chameleon".
* Skills should be listed in the order you want them to appear in the Nautsbuilder. This should match the order in the game (ie Leon has Tongue Snatch, then Cloaking Skin, then Slash, then Reptile Jump).
* If a skill is the auto attack or the jump, please note it in the `type` filed: "auto" for auto attack, "jump" for... jump.
* **Skill effects**. Each skill has one or more attributes: damage, cooldown, attack speed, etc. The `effect` field contains a list of the effects. Each element of the list is separated by `;`. One element of the list is composed of a key (ie "damage") and a value (ie "12"). Key and value are separated by a `:`. So, a clean list of effects is like `Damage: 8; Attack speed: 136; Range: 3.2`. Note that if a "damage" and a "attack speed" keys are detected, the Nautsbuilder will automatically show the DPS (Damage Per Second). Writing "damage" or "Damage" doesn't change anything.
* Jump skill: the character's jump skill must not be forgotten! Be sure to type the custom jump name (for Leon, it's "Reptile Jump"). The jump effect list contains the characters stats (mostly health and movement). **Pills**: if the character has light power pills, you should note it in the jump effects list. Final effects list for Reptile Jump of Leon looks like `health: 130; Movement: 7.4; Height: 1.6; Pills: light`

## Upgrades

* Each upgrade is tied to its skill. Binding between the upgrade and the skill is made on the `skill` field: be sure to type a name listed in the Skills sheet. Ie, having an Upgrade tied to "Tongue" will not work: the Skill is "Tongue Snatch".
* Upgrades should be listed in the order you want them to appear in the Nautsbuilder. This should match the order in the game (ie Slash has Chainsaw Addon, then Enhanced Muscle Fibers, then Clover of Honour, etc).
* If an upgrade is common to every character or so (present in the 4th row of upgrades, like Solar Tree or Piggy Bank), bind it to the "Jump" skill.
* If the upgrade replaces a common upgrade (like Solar Krab Burgers for Voltar), bind the upgrade to the character's jump skill (for Voltar, this would be "Hover"), and write the upgrade it must replaces in the `replaces` field (for Voltar and his burgers, this would be "Piggy Bank").
* Upgrade has multiple steps: describe them in `step1`, `step2`... fields. **Steps are formatted just like skill effects**: a `;` separated list of `key:value` pairs. The "keys" should match the ones of the skill. For example, if a skill has a `damage: 8`, and one of its upgrades adds 4 damage, make sure to write `damage: +4` in the step field, and not `damages: +4` or `adds 4 damage`.

# License

Licensed under MPL v2 http://mozilla.org/MPL/2.0/

That pretty much means you can take the code and integrate it in your app (open-sourced or not). Remember you must open-source the changes you make to the Nautsbuilder code.

# Third party stuff used
Code:

* [Underscore & Backbone.js](http://backbonejs.org/)
* [jQuery](jquery.com)
* [Sass](http://sass-lang.com/) & [Compass](http://compass-style.org/)
* [Tabletop](https://github.com/jsoma/tabletop)
* [Fastclick](https://github.com/ftlabs/fastclick)
* [HTML5 Sortable](http://farhadi.ir/projects/html5sortable/)

Icons:

* blue tick and red cancel buttons from the Awesomenauts Game,
* [Home](http://thenounproject.com/noun/home/#icon-No293) from The Noun Project
* [Gamepad menu icon](http://thenounproject.com/noun/video-game-controller/#icon-No17531) by [Vardan Stepanian](http://thenounproject.com/vardst)
* [Keyboard](http://thenounproject.com/noun/keyboard/#icon-No783) by [Paul te Kortschot](http://thenounproject.com/Kortschot)

# Credits

I want to sincerely thank my awesomenauts partners, Antoine, J and Fifou, who didn't help me at all to make this thing.

Big thanks to Carty1234, boxtoy, nokos, Devenger, Riyita and MikalMirkas, who, certainly among others, filled the spreadsheet with the data really fast. Thanks to the Ronimo team for the facebook/twitter posts.

Thanks Mom.
