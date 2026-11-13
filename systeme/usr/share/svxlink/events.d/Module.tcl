namespace eval Module {

proc activating_module {module_name} {
  playMsg "Default" "activating";
  playSilence 100;
  playMsg $module_name "name";
  playSilence 200;
}

proc deactivating_module {module_name} {
  playMsg "Default" "deactivating";
  playSilence 100;
  playMsg $module_name "name";
  playSilence 200;
}

proc timeout {module_name} {
  playMsg "Default" "timeout";
  playSilence 100;
}

proc play_help {module_name} {
  playMsg $module_name "help"
  playSubcommands $module_name help_subcmd "sub_commands_are"
}

}