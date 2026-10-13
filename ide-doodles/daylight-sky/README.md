Daylight Sky

Uses the location time zone selected in Doodles settings; updates once per minute, including daylight saving changes. Falls back to the device clock until the location time zone is available. Pastel blue until 17:00, peach at 17:30, stronger pastel coral pink at 18:00, rose at 19:00, and lavender by 20:00–21:00. Pane colors are mixed with white to keep them light. Pause, resume, and restore commands are in the Command Palette.

The Doodles time slider calls this extension's `daylightSky.setTime` command (minutes since midnight). Its override drives the same `workbench.colorCustomizations` update as the live clock, including terminal canvases. `daylightSky.getTime` keeps the slider in sync. Use live weather & time, or Resume Color Changes, clears the override. Overrides last until the window reloads. Applying doodles updates the installed extension along with the workbench bridge; reload to activate both.
