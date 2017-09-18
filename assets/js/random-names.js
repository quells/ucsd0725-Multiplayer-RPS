var RN_Nouns = ["aardvark", "barnacle", "caterpillar", "dragonfly", "elephant", "frog", "gecko", "hedgehog", "iguana", "jellyfish", "koala", "llama", "manatee", "newt", "octopus", "penguin", "quail", "raccoon", "salamander", "toucan", "umbrellabird", "vulture", "walrus", "yak", "zebra"];

var RN_Colors = ["red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal", "green", "light-green", "lime", "yellow", "amber", "orange", "deep-orange", "brown", "grey", "blue-grey", "black"];

function RandomName() {
    var adj = RN_Colors[Math.floor(RN_Colors.length * Math.random())];
    var noun = RN_Nouns[Math.floor(RN_Nouns.length * Math.random())];
    return adj + "." + noun;
};
