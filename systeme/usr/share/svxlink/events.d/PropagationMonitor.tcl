namespace eval PropagationMonitor {

if {![info exists CFG_ID]} {
  return
}

set module_name [namespace tail [namespace current]]


proc playMsg {msg} {
  variable module_name
  ::playMsg $module_name $msg
}

proc printInfo {msg} {
  variable module_name
  puts "$module_name: $msg"
}

proc activating_module {} {
  variable module_name
  Module::activating_module $module_name
}

proc deactivating_module {} {
  variable module_name;
  Module::deactivating_module $module_name;
}

proc timeout {} {
  variable module_name;
  Module::timeout $module_name;
}

proc play_help {} {
  variable module_name;
  Module::play_help $module_name;
}

proc status_report {} {
}

proc unknown_command {cmd} {
  playNumber $cmd
  playMsg "unknown_command"
}

proc playAlertSound {} {
  for {set i 0} {$i < 3} {set i [expr $i + 1]} {
    playTone 440 500 100
    playTone 880 500 100
    playTone 440 500 100
    playTone 880 500 100
    playSilence 600
  }
  playSilence 1000
}

proc sayBand {band} {
  if [regexp {^(\d+)(c?m)$} $band -> number unit] {
    if {[string length $number] == 2} {
      playTwoDigitNumber $number
    } else {
      playNumber $number
    }
    playMsg unit_$unit
  }
}

proc sayLocator {loc} {
  if [regexp {^(\w\w)(?:(\d\d)(\w\w)?)?$} $loc -> part1 part2 part3] {
    spellWord $part1
    playNumber $part2
  }
}

proc dxrobot_aurora_alert {hour min} {
  playAlertSound
  playSilence 500

  playMsg "aurora_opening"
  sayBand "2m"
  playSilence 500

  playMsg "aurora_opening"
  sayBand "2m"
  playSilence 200
}

proc dxrobot_eskip_alert {hour min band {from ""} {to ""}} {
  playAlertSound
  playSilence 500

  playMsg "sporadic_e_opening"
  sayBand $band
  playSilence 500
  playMsg "sporadic_e_opening"
  sayBand $band

  if {"$from" ne "" && "$to" ne ""} {
    playSilence 500
    playMsg "band_open_from"
    spellWord $from
    playSilence 100
    playMsg "to"
    playSilence 100
    spellWord $to
  }
  playSilence 200
}

proc vhfdx_sporadic_e_opening {band muf locator} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg sporadic_e_opening
    sayBand $band
    playSilence 500
    playMsg MUF
    playSilence 100
    playNumber $muf
    playMsg unit_MHz
    playSilence 200
    playMsg above
    playSilence 200
    sayLocator $locator
    playSilence 1000
  }
}

proc vhfdx_possible_sporadic_e_opening {band from_loc to_loc direction} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg possible
    playMsg sporadic_e_opening
    sayBand $band
    playSilence 100
    playMsg between
    playSilence 200
    sayLocator $from_loc
    playSilence 200
    playMsg and
    playSilence 200
    sayLocator $to_loc
    playSilence 1000
  }
}

proc vhfdx_multi_hop_sporadic_e_opening {band} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg multi_hop
    playMsg sporadic_e_opening
    sayBand $band
    playSilence 1000
  }
}

proc vhfdx_tropo_opening {band range call1 loc1 call2 loc2} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg tropo_opening
    sayBand $band
    playSilence 200
    playMsg between
    sayLocator $loc1
    playSilence 200
    playMsg and
    playSilence 200
    sayLocator $loc2
    playSilence 1000
  }
}

proc vhfdx_aurora_opening {band lat call loc} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg aurora_opening
    sayBand $band
    playSilence 200
    playMsg down_to_lat
    playNumber $lat
    playMsg unit_deg
    playSilence 1000
  }
}

proc vhfdx_fai_active {band} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg "fai_active_on"
    playSilence 200
    sayBand $band
    playSilence 1000
  }
}

proc vhfdx_tep_opening {band} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg "tep"
    playMsg "opening_on"
    playSilence 200
    sayBand $band
    playSilence 1000
  }
}

proc vhfdx_f2_opening {band} {
  playAlertSound
  for {set i 0} {$i < 2} {set i [expr $i + 1]} {
    playMsg "f2"
    playMsg "opening_on"
    playSilence 200
    sayBand $band
    playSilence 1000
  }
}

}