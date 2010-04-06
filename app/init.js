
function main () {
  // We don't really have much to do except start the prompt program I think.
  var prompt = "app/prompt.js";

  spawn(get_contents(prompt), [prompt], null, null, null, main);
}

