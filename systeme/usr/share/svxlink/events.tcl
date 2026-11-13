proc playMsg {context msg} {
  global basedir
  global langdir

  set candidates [glob -nocomplain "$langdir/$context/$msg.{wav,raw,gsm}" \
                                   "$langdir/Default/$msg.{wav,raw,gsm}"];
  if { [llength $candidates] > 0 } {
    playFile [lindex $candidates 0];
  } else {
    puts "*** WARNING: Could not find audio clip \"$msg\" in context \"$context\"";
  }
}

proc playSubcommands {context basename {header ""}} {
  global basedir
  global langdir

  set subcmds [glob -nocomplain "$langdir/$context/$basename*.{wav,raw,gsm}"]
  if {[llength $subcmds] > 0} {
    if {$header != ""} {
      playSilence 500
      playMsg $context $header
    }

    append match_exp {^.*/} $basename {(\d+)([ABCD*#]*)\.}
    foreach subcmd [lsort $subcmds] {
      if [regexp $match_exp $subcmd -> number chars] {
        playSilence 200
        playNumber $number
        spellWord $chars
        playSilence 200
        playFile $subcmd
      }
    }
  }
}

proc processEvent {module ev} {
  append func $module "::" $ev
  eval "$func"
}

proc sourceTcl {filename} {
  if [file readable $filename] {
    source $filename
  } else {
    puts "*** WARNING: Could not load TCL event file: $filename"
  }
}

set basedir [file dirname $script_path];
if [info exists Logic::CFG_DEFAULT_LANG] {
  set lang $Logic::CFG_DEFAULT_LANG
} else {
  set lang "en_US"
}

set langdir "$basedir/sounds/$lang"

foreach {file} [glob -directory $basedir/events.d *.tcl] {
  sourceTcl $file
}

foreach {file} [glob -nocomplain -directory $basedir/events.d/local *.tcl] {
  sourceTcl $file;
}

foreach {file} [glob -nocomplain -directory $langdir/events.d *.tcl] {
  sourceTcl $file;
}

foreach {file} [glob -nocomplain -directory $langdir/events.d/local *.tcl] {
  sourceTcl $file;
}

foreach {file} [glob -directory $basedir/modules.d *.tcl] {
  sourceTcl $file;
}

if [info exists is_core_event_handler] {
  puts "$logic_name: Event handler script successfully loaded.";
}