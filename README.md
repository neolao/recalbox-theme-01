Theme neolao 01 for Recalbox
============================

Download
--------
```bash
cd /recalbox/share/themes
wget https://github.com/neolao/recalbox-theme-01/releases/latest/download/armv7.zip -O neolao-01.zip
unzip neolo-01.zip
```

Generate images
---------------
You should put each game image source on `/recalbox/share/roms/[system]/theme-neolao-01-source/`.

Then run the following command:
```bash
/recalbox/share/themes/neolao-01/cli generateGameImages
```

The folders `/recalbox/share/romms/[system]/theme-neolao-01-generated/` will be generated.

Update gamelists
----------------
To update the gamelists with the generated images, run the following command:
```bash
/recalbox/share/themes/neolao-01/cli updateGamelists
```

Create a game image
-------------------
Use the file `images/default_game_image.png` as a template to create your game image and put it on `/recalbox/share/roms/[system]/theme-neolao-01-source/`.
