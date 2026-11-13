namespace eval Parrot {

if {![info exists CFG_ID]} {
  return;
}

set module_name [namespace tail [namespace current]];

proc playMsg {msg} {
  variable module_name;
  ::playMsg $module_name $msg;
}

proc printInfo {msg} {
  variable module_name;
  puts "$module_name: $msg";
}

proc activating_module {} {
  variable module_name;
  Module::activating_module $module_name;
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

proc spell_digits {digits} {
  spellWord $digits;
  playSilence 500;
}

proc all_played {} {
}

}