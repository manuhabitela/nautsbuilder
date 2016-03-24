# Nautsbuilder

You play Awesomenauts and want to try new builds? The Nautsbuilder is here. It allows you to create and share builds easily for each naut', directly on the web.

## Dealing with data

### How it works

This JavaScript app is mostly built with Backbone.js. The particular thing is that it gets all its data from **a google spreadsheet** thanks to Tabletop.js.

This allows for everyone to quickly and easily change characters attributes and upgrades in case of Awesomenauts patches.

And thanks to the community, all characters/skills/upgrades data is now in the spreadsheet :)

### Filling the spreadsheet correctly

There are two spreadsheets: one for PC data, one for console data.

PC data is available here https://docs.google.com/spreadsheet/ccc?key=0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc

Console data is available here https://docs.google.com/spreadsheet/ccc?key=0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE

It is pretty simple to fill but there are a few things to know.

* **If you change anything in the PC spreadsheet, let me know in the [forum](http://www.awesomenauts.com/forum/viewtopic.php?f=14&t=13663)**. A manual update of the Nautsbuilder is required to reflect new data change as soon as possible.
* There are 3 different sheets: Characters, Skills, and Upgrades. You can switch sheets at the bottom of the screen.
* For every sheet, please **don't put any empty completely rows or columns**: any row/column after a completely empty row/column would become unavailable by the Nautsbuilder. Having only unique cells empty doesn't make any trouble though: if you can't fill a cell, no need no write "null", "empty" or anything.
* Every `description` field will translate \*sentences like this\* as *sentences in italics like this*.
* To fill everything easily and quickly, find the wiki page of the character you're working on (ie for Leon: http://awesomenauts.wikia.com/wiki/Leon_Chameleon). Almost every info on skills and upgrades are there. From time to time you might need to look at the game or the official website if you want more info.
* Every image is a direct link to an external resource right now. It's usually image linked from the wiki.
* Finally if you have trouble, don't hesitate to look at how is structured existing data, or ping me in the [forum](http://www.awesomenauts.com/forum/viewtopic.php?f=14&t=13663) (Leimi).

#### Characters

The Character sheet is easy. `name`, `icon` and `image` fields are required so the app works well, other ones are bonus.
`icon` is the link to an image showing the character head in a square used in the characters list, while the `image` is the link to a big image of the entire character used on the homepage of the Nautsbuilder.
The `beta` flag is there for people who can't wait to see a new character in the Nautsbuilder. Set it to `1` to let the Nautsbuilder know the character is not yet available in the game, but only in beta.

Characters should be listed in the same order as they are in the character selection screen in the game.

#### Skills

* Each skill is tied to its character. Binding between the skill and the character is made on the `character` field: be sure to type a name listed in the Characters sheet. Ie, having a Skill tied to "Leon" will not work: the Character is "Leon Chameleon".
* Skills should be listed in the order you want them to appear in the Nautsbuilder. This should match the order in the game (ie Leon has Tongue Snatch, then Cloaking Skin, then Slash, then Reptile Jump).
* If a skill is the auto attack or the jump, please note it in the `type` filed: "auto" for auto attack, "jump" for... jump.
* **Skill effects**. Each skill has one or more attributes: damage, cooldown, attack speed, etc. The `effect` field contains a list of the effects. Each element of the list is separated by `;`. One element of the list is composed of a key (ie "damage") and a value (ie "12"). Key and value are separated by a `:`. So, a clean list of effects is like `Damage: 8; Attack speed: 136; Range: 3.2`. Note that if a "damage" and a "attack speed" keys are detected, the Nautsbuilder will automatically show the DPS (Damage Per Second). Writing "damage" or "Damage" doesn't change anything. You can add a "damage multiplier" effect to split the damage a skill does. For example, Vinnie & Spike shoots 3 bullets that does 3 damage each with its Bubble Gun. You can write `Damage: 3; Damage multiplier: 3;` to let the Nautsbuilder calculates total damage and DPS accordingly. This actually works for damage stuff but also [any other effect](https://github.com/Leimi/nautsbuilder/pull/13#issuecomment-38432751).
* Jump skill: the character's jump skill must not be forgotten! Be sure to type the custom jump name (for Leon, it's "Reptile Jump"). The jump effect list contains the characters stats (mostly health and movement). **Pills**: if the character has light power pills, you should note it in the jump effects list. Final effects list for Reptile Jump of Leon looks like `health: 130; Movement: 7.4; Height: 1.6; Pills: light`

#### Upgrades

* Each upgrade is tied to its skill. Binding between the upgrade and the skill is made on the `skill` field: be sure to type a name listed in the Skills sheet. Ie, having an Upgrade tied to "Tongue" will not work: the Skill is "Tongue Snatch".
* Upgrades should be listed in the order you want them to appear in the Nautsbuilder. This should match the order in the game (ie Slash has Chainsaw Addon, then Enhanced Muscle Fibers, then Clover of Honour, etc).
* If an upgrade is common to every character or so (present in the 4th row of upgrades, like Solar Tree or Piggy Bank), bind it to the "Jump" skill.
* If the upgrade replaces a common upgrade (like Solar Krab Burgers for Voltar), bind the upgrade to the character's jump skill (for Voltar, this would be "Hover"), and write the upgrade it must replaces in the `replaces` field (for Voltar and his burgers, this would be "Piggy Bank").
* Upgrade has multiple steps: describe them in `step1`, `step2`... fields. **Steps are formatted just like skill effects**: a `;` separated list of `key:value` pairs. The "keys" should match the ones of the skill. For example, if a skill has a `damage: 8`, and one of its upgrades adds 4 damage, make sure to write `damage: +4` in the step field, and not `damages: +4` or `adds 4 damage`.
* Note that steps of the same upgrade don't stack. Imagine an upgrade which adds 2 damage to the auto attack at each step: you should write `damage: +2` in the `step1` field and `damage +4` in the `step2` field.
* If a skill has multiple upgrades with similar effects, they stack by default. For example, Lonestar's Bull has two Slow upgrades. While the `Slowing Power` effect should take both upgrade values, the `Slow Duration` is 3 seconds whether you take only one or both upgrades. To prevent stacking of an effect, an effect value should be prefixed with a `@`. The effect of (Mature) Ribbit Snail Slime is, in the end, written like this `Slowing Power: +30%; Slow Duration: @3s`.

## Dealing with code

The Nautbuilders is a web application built with the help of *Backbone.js*, *Sass* and *PHP*.

### Requirements

In order to build and run your own (local) instance of Nautsbuilder, you need to the following software:

* [PHP 5](https://php.net/)
* [Grunt](http://gruntjs.com) and [npm](https://npmjs.org/)
* [Compass](http://compass-style.org) and [SCSS-Lint](https://github.com/brigade/scss-lint)

For Ubuntu, you can run the following commands:
```bash
sudo apt-get install php5 nodejs nodejs-legacy npm ruby ruby-dev
sudo gem update --system
sudo gem install compass scss_lint
sudo npm update -g npm
sudo npm install -g grunt-cli
cd nautsbuilder
npm install
```

### Running Nautsbuilder locally

To debug and test new versions locally, change into your Nautsbuilder directory and start a local PHP web server:

```bash
cd nautsbuilder
php -S localhost:8080
```

Then, open your preferred browser and navigate to http://localhost:8080.

### Building a new version

1. Increase the version of the Nautsbilder in both `package.json` and `index.php`.

2. Add all newly added Javascript files to both `index.php` and `Gruntfile.js`.

3. Generate the production files with Grunt inside the Nautsbuilder directory:
   ```bash
cd nautsbuilder
grunt
   ```
   Grunt generates the files in the `dist` directory.

4. Test the production by manually setting the PHP variable `PROD` at the top in `index.php` to `true`:
   ```php
   define('PROD', true);
   ```

5. Upload all updated files to the webserver:
   * `index.php`
   * `dist` directory
   * other files like new images, fonts, etc.

## License

Licensed under MPL v2 http://mozilla.org/MPL/2.0/.

This means that anyone can integrate the code into his/her own application, open-sourced or not. All changes made to the Nautsbuilder code *must be made open-sourced*.

## Third party material

Nautsbuilder uses the following libraries:

* [Underscore & Backbone.js](http://backbonejs.org/)
* [jQuery](jquery.com)
* [Sass](http://sass-lang.com/) & [Compass](http://compass-style.org/)
* [Tabletop](https://github.com/jsoma/tabletop)
* [Fastclick](https://github.com/ftlabs/fastclick)
* [HTML5 Sortable](http://farhadi.ir/projects/html5sortable/)
* [Input-range-sass](https://github.com/darlanrod/input-range-sass)

and the following icons & images:

* Blue tick icon, red cancel icon, XP symbol, Starstorm and Overdrive icon from the Awesomenauts game, ©Ronimo games
* [Home icon](http://thenounproject.com/noun/home/#icon-No293) from [The Noun Project](https://thenounproject.com/)
* [Gamepad menu icon](http://thenounproject.com/noun/video-game-controller/#icon-No17531) by [Vardan Stepanian](http://thenounproject.com/vardst)
* [Keyboard icon](http://thenounproject.com/noun/keyboard/#icon-No783) by [Paul te Kortschot](http://thenounproject.com/Kortschot)
* [Star icon](http://www.iconfinder.com/icondetails/1935/32/bookmark_star_icon) by [Alexandre Moore](http://sa-ki.deviantart.com/)

## Credits

I want to sincerely thank my Awesomenauts partners, Antoine, J and Fifou, who didn't help me at all to make this thing.

Big thanks to Carty1234, boxtoy, nokos, Devenger, Riyita, MikalMirkas and Xelrog, who, certainly among others, filled the spreadsheet with the data really fast. Thanks to the Ronimo team for the Facebook/Twitter posts and the cool logo.
