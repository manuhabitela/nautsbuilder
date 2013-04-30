# This is a work in progress!


# NautsBuilder

You play Awesomenauts and are tired to navigate on the wiki to try new builds? **Things have changed**. The NautsBuilder allows you to create and share builds easily, on the web.

# How it works

Mostly built with Backbone.js, the thing with this app is that it gets all its data from **a google spreadsheet** thanks to Tabletop.js.

This allows to quickly and easily change characters attributes and upgrades in case of Awesomenauts patchs.

The only "catch" is that this spreadsheet must be filled will all the characters, all their skills, and all their upgrades. This is easy (thanks copy and paste) but takes a little while as a one-man team.

Thanks to the community, all characters/skills/upgrades are now in the spreadsheet :)

# Filling the spreadsheet correctly

The spreadsheet is available here https://docs.google.com/spreadsheet/ccc?key=0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc

It is pretty simple to fill but there a few things to know.

* There are 3 different sheets: Characters, Skills, and Upgrades. You can switch sheets at the bottom of the screen.
* For every sheet, please **don't put any empty rows or columns**: any row/column after a completely empty row/column would become unavailable by the NautsBuilder.
* Every `description` field will translate \*sentences like this\* as *sentences in italics like this*.
* To fill everything easily and quickly, find the wiki page of the character you're working on (ie for Leon: http://awesomenauts.wikia.com/wiki/Leon_Chameleon). Almost every info on skills and upgrades are there. From time to time you might need to look at the game if you want more info.
* Finally if you have trouble, you can see an example of well-formatted data with **Leon Chameleon**, or ping me in the [forum](http://www.awesomenauts.com/forum/viewtopic.php?f=14&t=13663) (Leimi).

## Characters

The Character sheet is easy. `name` and `icon` fields are required so the app works well, other ones are bonus.

## Skills

* Each skill is tied to its character. Binding between the skill and the character is made on the `character` field: be sure to type a name listed in the Characters sheet. Ie, having a Skill tied to "Leon" will not work: the Character is "Leon Chameleon".
* Skills should be listed in the order you want them to appear in the NautsBuilder. This should match the order in the game (ie Leon has Tongue Snatch, then Cloaking Skin, then Slash, then Reptile Jump).
* If a skill is the auto attack or the jump, please note it in the `type` filed: "auto" for auto attack, "jump" for... jump.
* **Skill effects**. Each skill has one or more attributes: damage, cooldown, attack speed, etc. The `effect` field contains a list of the effects. Each element of the list is separated by `;`. One element of the list is composed of a key (ie "damage") and a value (ie "12"). Key and value are separated by a `:`. So, a clean list of effects is like `Damage: 8; Attack speed: 136; Range: 3.2`. Note that if a "damage" and a "attack speed" keys are detected, the NautsBuilder will automatically show the DPS (Damage Per Second). Writing "damage" or "Damage" doesn't change anything.
* Jump skill: the character's jump skill must not be forgotten! Be sure to type the custom jump name (for Leon, it's "Reptile Jump"). The jump effect list contains the characters stats (mostly health and movement). **Pills**: if the character has light power pills, you should note it in the jump effects list. Final effects list for Reptile Jump of Leon looks like `health: 130; Movement: 7.4; Height: 1.6; Pills: light`

## Upgrades

* Each upgrade is tied to its skill. Binding between the upgrade and the skill is made on the `skill` field: be sure to type a name listed in the Skills sheet. Ie, having an Upgrade tied to "Tongue" will not work: the Skill is "Tongue Snatch".
* Upgrades should be listed in the order you want them to appear in the NautsBuilder. This should match the order in the game (ie Slash has Chainsaw Addon, then Enhanced Muscle Fibers, then Clover of Honour, etc).
* If an upgrade is common to every character or so (present in the 4th row of upgrades, like Solar Tree or Piggy Bank), bind it to the "Jump" skill.
* If the upgrade replaces a common upgrade (like Solar Krab Burgers for Voltar), bind the upgrade to the character's jump skill (for Voltar, this would be "Hover"), and write the upgrade it must replaces in the `replaces` field (for Voltar and his burgers, this would be "Piggy Bank").
* Upgrade has multiple steps: describe them in `step1`, `step2`... fields. **Steps are formatted just like skill effects**: a `;` separated list of `key:value` pairs. The "keys" should match the ones of the skill. For example, if a skill has a `damage: 8`, and one of its upgrades adds 4 damage, make sure to write `damage: +4` in the step field, and not `damages: +4` or `adds 4 damage`.



# Licence

Licensed under GPL v2 http://www.opensource.org/licenses/gpl-2.0.php

# Credits

I want to sincerely thank my awesomenauts partners, Antoine, J and Fifou, who didn't help me at all to make this thing.
Big thanks to Carty1234, boxtoy, nokos, Devenger, Riyita and MikalMirkas, who, certainly among others, filled the spreadsheet will the data really fast.

