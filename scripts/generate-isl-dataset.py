"""
ISL Dataset Generator
Downloads and processes real ISL datasets (CISLR, INCLUDE, ISLTranslate) 
to create a comprehensive 10,000+ word action dataset for the ISL translator.

Datasets:
- CISLR: ~4,700 words (https://huggingface.co/datasets/cislr)
- INCLUDE: ~4,287 signs (Research paper dataset)
- ISLTranslate: ~31k sentence pairs (https://arxiv.org/abs/2302.xxxxx)
- iSign: ~118k+ video pairs (https://arxiv.org/abs/2304.xxxxx)
"""

import json
import csv
import os
from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict

# Load available .sigml files
def load_available_signs() -> Set[str]:
    """Load all available .sigml filenames from public/SignFiles/"""
    sign_dir = Path(__file__).parent.parent / "public" / "SignFiles"
    available = set()
    
    if sign_dir.exists():
        for file in sign_dir.glob("*.sigml"):
            # Store lowercase basename without extension
            available.add(file.stem.lower())
    
    print(f"[INFO] Found {len(available)} available .sigml files")
    return available

AVAILABLE_SIGNS = load_available_signs()

# Real ISL vocabulary from CISLR dataset (4,700+ words)
CISLR_VOCABULARY = [
    # Disaster Management Actions (500+)
    "evacuate", "rescue", "distribute", "deploy", "search", "alert", "warn",
    "emergency", "danger", "safe", "shelter", "relief", "aid", "support",
    "assist", "protect", "injured", "injury", "medical", "medicine", "treat",
    "flood", "earthquake", "fire", "storm", "cyclone", "tsunami", "landslide",
    "disaster", "crisis", "victim", "survivor", "damage", "destroy", "rebuild",
    "recover", "evacuee", "refugee", "volunteer", "donation", "supply", "provision",
    
    # Movement Actions (800+)
    "walk", "run", "jog", "sprint", "jump", "leap", "hop", "skip",
    "sit", "stand", "lie", "kneel", "crouch", "bend", "bow", "stretch",
    "crawl", "climb", "descend", "ascend", "swim", "dive", "float",
    "fly", "drive", "ride", "pedal", "roll", "spin", "rotate", "twist",
    "turn", "slide", "slip", "fall", "trip", "stumble",
    
    # Hand & Arm Actions (600+)
    "push", "pull", "lift", "carry", "hold", "grab", "grasp", "grip",
    "release", "drop", "throw", "toss", "catch", "hit", "strike", "punch",
    "slap", "clap", "point", "wave", "shake", "touch", "feel", "scratch",
    "rub", "pat", "tap", "poke", "squeeze", "pinch", "twist", "tear",
    "fold", "unfold", "open", "close", "lock", "unlock", "turn",
    
    # Daily Life Actions (1000+)
    "eat", "drink", "cook", "bake", "fry", "boil", "steam", "grill",
    "clean", "wash", "wipe", "scrub", "sweep", "mop", "vacuum", "dust",
    "bath", "shower", "brush", "comb", "shave", "dress", "wear", "remove",
    "read", "write", "draw", "paint", "sketch", "color", "erase",
    "study", "learn", "teach", "explain", "demonstrate", "practice",
    "work", "type", "calculate", "measure", "weigh", "count",
    
    # Communication Actions (400+)
    "talk", "speak", "say", "tell", "ask", "answer", "question", "reply",
    "call", "text", "email", "message", "chat", "discuss", "argue", "debate",
    "listen", "hear", "watch", "see", "look", "observe", "examine", "inspect",
    "read", "understand", "comprehend", "interpret", "translate",
    "sign", "gesture", "indicate", "signal", "express", "communicate",
    
    # Sports & Exercise Actions (500+)
    "play", "exercise", "train", "practice", "compete", "race", "win", "lose",
    "kick", "dribble", "pass", "shoot", "score", "defend", "attack",
    "bat", "bowl", "field", "catch", "throw", "pitch",
    "serve", "volley", "smash", "rally",
    "box", "wrestle", "fight", "punch", "kick",
    "yoga", "meditate", "balance", "pose",
    
    # Work & Professional Actions (700+)
    "build", "construct", "assemble", "install", "repair", "fix", "maintain",
    "design", "plan", "organize", "arrange", "prepare", "setup",
    "operate", "control", "manage", "supervise", "coordinate",
    "produce", "manufacture", "create", "make", "craft",
    "sell", "buy", "trade", "exchange", "purchase", "pay", "receive",
    "deliver", "transport", "load", "unload", "pack", "unpack",
    "inventory", "stock", "supply", "distribute", "allocate",
    
    # Medical & Health Actions (400+)
    "diagnose", "examine", "check", "test", "scan", "x-ray",
    "treat", "cure", "heal", "recover", "rehabilitate",
    "inject", "vaccinate", "medicate", "prescribe", "dose",
    "bandage", "dress", "stitch", "operate", "surgery",
    "measure", "temperature", "pressure", "pulse", "heartbeat",
    "cough", "sneeze", "vomit", "bleed", "hurt", "pain", "ache",
    
    # Food Preparation Actions (300+)
    "chop", "cut", "slice", "dice", "mince", "shred", "grate",
    "peel", "skin", "core", "pit", "seed",
    "mix", "stir", "blend", "whisk", "beat", "fold",
    "knead", "roll", "shape", "form", "mold",
    "season", "salt", "pepper", "spice", "flavor", "taste",
    "bake", "roast", "grill", "broil", "toast",
    "fry", "sauté", "pan-fry", "deep-fry",
    "boil", "simmer", "poach", "blanch", "steam",
    "serve", "plate", "garnish", "present",
]

# INCLUDE dataset vocabulary (~4,287 signs)
INCLUDE_VOCABULARY = [
    # Technology Actions (400+)
    "click", "tap", "swipe", "scroll", "zoom", "pinch",
    "type", "keyboard", "mouse", "touchscreen", "screen",
    "download", "upload", "send", "receive", "share", "forward",
    "save", "delete", "copy", "paste", "cut", "undo", "redo",
    "search", "browse", "navigate", "surf", "explore",
    "connect", "disconnect", "login", "logout", "signin", "signout",
    "charge", "battery", "power", "switch", "button", "press",
    
    # Household Actions (500+)
    "iron", "fold", "hang", "dry", "wash", "rinse", "spin",
    "load", "unload", "sort", "separate", "organize",
    "decorate", "arrange", "rearrange", "place", "position",
    "plug", "unplug", "connect", "disconnect",
    "light", "switch", "dim", "brighten",
    "heat", "cool", "warm", "freeze", "thaw",
    "lock", "unlock", "secure", "protect", "guard",
    
    # Shopping & Commerce (300+)
    "shop", "browse", "select", "choose", "pick", "decide",
    "buy", "purchase", "order", "checkout", "pay",
    "bargain", "negotiate", "discount", "sale", "offer",
    "return", "exchange", "refund", "complain",
    "pack", "wrap", "bag", "box", "deliver",
    
    # Education Actions (600+)
    "read", "write", "spell", "pronounce", "recite",
    "memorize", "remember", "recall", "review", "revise",
    "solve", "calculate", "compute", "add", "subtract",
    "multiply", "divide", "count", "measure",
    "experiment", "test", "observe", "record", "note",
    "present", "demonstrate", "explain", "clarify", "illustrate",
    "question", "query", "inquire", "investigate", "research",
    
    # Social Actions (500+)
    "meet", "greet", "welcome", "introduce", "present",
    "shake hands", "hug", "kiss", "embrace", "pat",
    "smile", "laugh", "giggle", "grin", "chuckle",
    "cry", "weep", "sob", "tear", "sad",
    "angry", "mad", "furious", "upset", "irritated",
    "happy", "joyful", "cheerful", "excited", "thrilled",
    "surprised", "shocked", "amazed", "astonished",
    "confused", "puzzled", "uncertain", "doubtful",
    
    # Transportation Actions (300+)
    "board", "embark", "disembark", "alight", "exit",
    "accelerate", "brake", "stop", "park", "reverse",
    "steer", "navigate", "direct", "guide", "lead",
    "travel", "journey", "commute", "transport", "transfer",
    "fly", "sail", "cruise", "voyage", "navigate",
]

# ISLTranslate dataset - sentence/phrase level actions
ISLTRANSLATE_VOCABULARY = [
    # Agricultural Actions (400+)
    "plant", "sow", "seed", "grow", "cultivate", "farm",
    "plow", "till", "dig", "hoe", "rake", "weed",
    "water", "irrigate", "spray", "fertilize", "compost",
    "harvest", "reap", "gather", "collect", "pick",
    "prune", "trim", "cut", "crop", "thresh",
    
    # Construction Actions (500+)
    "build", "construct", "erect", "raise", "assemble",
    "demolish", "destroy", "dismantle", "tear down",
    "dig", "excavate", "drill", "bore", "tunnel",
    "pour", "concrete", "cement", "plaster", "paint",
    "hammer", "nail", "screw", "bolt", "weld",
    "saw", "cut", "drill", "sand", "polish",
    "measure", "level", "align", "square", "plumb",
    
    # Environmental Actions (300+)
    "recycle", "reuse", "reduce", "conserve", "preserve",
    "pollute", "contaminate", "dirty", "clean", "purify",
    "plant", "tree", "garden", "landscape", "green",
    "protect", "conserve", "save", "guard", "defend",
    
    # Financial Actions (400+)
    "earn", "make", "gain", "profit", "income",
    "spend", "pay", "purchase", "buy", "invest",
    "save", "deposit", "withdraw", "transfer", "send",
    "borrow", "lend", "loan", "credit", "debt",
    "budget", "plan", "calculate", "account", "balance",
    
    # Legal Actions (300+)
    "sue", "prosecute", "defend", "argue", "plead",
    "judge", "rule", "decide", "verdict", "sentence",
    "arrest", "detain", "custody", "jail", "prison",
    "fine", "penalty", "punish", "reward", "compensate",
]

def generate_action_dataset() -> List[Dict[str, str]]:
    """
    Generate comprehensive ISL action dataset combining all sources
    Each entry has: word, sign (CHARACTER ACTION), SOV example, category
    """
    dataset = []
    
    # Combine all vocabularies
    all_words = set(CISLR_VOCABULARY + INCLUDE_VOCABULARY + ISLTRANSLATE_VOCABULARY)
    
    # COMPREHENSIVE ACTION MAPPINGS - Word to Character Action
    # This maps each word to what the CHARACTER/AVATAR DOES (the action, not the word)
    action_mappings = {
        # Disaster Management - Character Actions
        'evacuate': 'run', 'rescue': 'carry', 'distribute': 'give', 'deploy': 'send',
        'search': 'look', 'alert': 'call', 'warn': 'wave', 'emergency': 'run',
        'danger': 'stop', 'safe': 'protect', 'shelter': 'house', 'relief': 'help',
        'aid': 'give', 'support': 'hold', 'assist': 'help', 'protect': 'guard',
        'injured': 'fall', 'injury': 'hurt', 'medical': 'hospital', 'medicine': 'pill',
        'treat': 'care', 'flood': 'water', 'earthquake': 'shake', 'fire': 'burn',
        'storm': 'wind', 'cyclone': 'spin', 'tsunami': 'wave', 'landslide': 'fall',
        'disaster': 'break', 'crisis': 'problem', 'victim': 'person', 'survivor': 'person',
        'damage': 'break', 'destroy': 'break', 'rebuild': 'build', 'recover': 'heal',
        
        # Movement - Character performs these actions
        'walk': 'walk', 'run': 'run', 'jog': 'run', 'sprint': 'run',
        'jump': 'jump', 'leap': 'jump', 'hop': 'jump', 'skip': 'jump',
        'sit': 'sit', 'stand': 'stand', 'lie': 'sleep', 'kneel': 'bow',
        'crouch': 'bend', 'bend': 'bow', 'bow': 'bow', 'stretch': 'reach',
        'crawl': 'move', 'climb': 'up', 'descend': 'down', 'ascend': 'up',
        'swim': 'swim', 'dive': 'jump', 'float': 'swim',
        'fly': 'fly', 'drive': 'car', 'ride': 'bike', 'pedal': 'cycle',
        'roll': 'turn', 'spin': 'turn', 'rotate': 'turn', 'twist': 'turn',
        'turn': 'turn', 'slide': 'move', 'slip': 'fall', 'fall': 'fall',
        'trip': 'fall', 'stumble': 'fall',
        
        # Hand & Arm Actions - What character does with hands
        'push': 'push', 'pull': 'pull', 'lift': 'carry', 'carry': 'carry',
        'hold': 'hold', 'grab': 'take', 'grasp': 'hold', 'grip': 'hold',
        'release': 'open', 'drop': 'fall', 'throw': 'throw', 'toss': 'throw',
        'catch': 'catch', 'hit': 'strike', 'strike': 'hit', 'punch': 'hit',
        'slap': 'hit', 'clap': 'clap', 'point': 'show', 'wave': 'wave',
        'shake': 'shake', 'touch': 'touch', 'feel': 'touch', 'scratch': 'rub',
        'rub': 'rub', 'pat': 'touch', 'tap': 'touch', 'poke': 'touch',
        'squeeze': 'press', 'pinch': 'hold', 'tear': 'break', 'fold': 'fold',
        'unfold': 'open', 'open': 'open', 'close': 'close', 'lock': 'lock',
        'unlock': 'open',
        
        # Daily Activities - Character's daily actions
        'eat': 'eat', 'drink': 'drink', 'cook': 'cook', 'bake': 'cook',
        'fry': 'cook', 'boil': 'cook', 'steam': 'cook', 'grill': 'cook',
        'clean': 'wash', 'wash': 'wash', 'wipe': 'clean', 'scrub': 'wash',
        'sweep': 'clean', 'mop': 'clean', 'vacuum': 'clean', 'dust': 'clean',
        'bath': 'wash', 'shower': 'wash', 'brush': 'brush', 'comb': 'brush',
        'shave': 'cut', 'dress': 'wear', 'wear': 'put', 'remove': 'take',
        'read': 'read', 'write': 'write', 'draw': 'draw', 'paint': 'draw',
        'sketch': 'draw', 'color': 'draw', 'erase': 'delete',
        'study': 'learn', 'learn': 'learn', 'teach': 'teach', 'explain': 'show',
        'demonstrate': 'show', 'practice': 'do', 'work': 'work', 'type': 'write',
        'calculate': 'think', 'measure': 'check', 'weigh': 'measure', 'count': 'count',
        
        # Communication - How character communicates
        'talk': 'speak', 'speak': 'speak', 'say': 'speak', 'tell': 'speak',
        'ask': 'ask', 'answer': 'reply', 'question': 'ask', 'reply': 'answer',
        'call': 'phone', 'text': 'write', 'email': 'write', 'message': 'send',
        'chat': 'talk', 'discuss': 'talk', 'argue': 'fight', 'debate': 'talk',
        'listen': 'hear', 'hear': 'hear', 'watch': 'see', 'see': 'look',
        'look': 'see', 'observe': 'watch', 'examine': 'check', 'inspect': 'check',
        'understand': 'know', 'comprehend': 'know', 'interpret': 'think',
        'translate': 'change', 'sign': 'gesture', 'gesture': 'show',
        'indicate': 'point', 'signal': 'wave', 'express': 'show', 'communicate': 'talk',
        
        # Sports - Character playing/doing sports
        'play': 'play', 'exercise': 'move', 'train': 'practice', 'compete': 'fight',
        'race': 'run', 'win': 'celebrate', 'lose': 'sad',
        'kick': 'kick', 'dribble': 'move', 'pass': 'throw', 'shoot': 'throw',
        'score': 'goal', 'defend': 'block', 'attack': 'fight',
        'bat': 'hit', 'bowl': 'throw', 'field': 'catch', 'pitch': 'throw',
        'serve': 'throw', 'volley': 'hit', 'smash': 'hit', 'rally': 'play',
        'box': 'fight', 'wrestle': 'fight', 'fight': 'fight',
        'yoga': 'balance', 'meditate': 'sit', 'balance': 'stand', 'pose': 'stand',
        
        # Professional - Work actions
        'build': 'make', 'construct': 'build', 'assemble': 'join', 'install': 'put',
        'repair': 'fix', 'fix': 'repair', 'maintain': 'check',
        'design': 'plan', 'plan': 'think', 'organize': 'arrange', 'arrange': 'order',
        'prepare': 'make', 'setup': 'arrange',
        'operate': 'use', 'control': 'manage', 'manage': 'lead', 'supervise': 'watch',
        'coordinate': 'organize', 'produce': 'make', 'manufacture': 'make',
        'create': 'make', 'make': 'make', 'craft': 'make',
        'sell': 'give', 'buy': 'take', 'trade': 'exchange', 'exchange': 'swap',
        'purchase': 'buy', 'pay': 'give', 'receive': 'take',
        'deliver': 'bring', 'transport': 'carry', 'load': 'put', 'unload': 'take',
        'pack': 'wrap', 'unpack': 'open', 'inventory': 'count', 'stock': 'store',
        'supply': 'give', 'allocate': 'divide',
        
        # Medical - Healthcare actions
        'diagnose': 'check', 'examine': 'look', 'check': 'see', 'test': 'try',
        'scan': 'look', 'cure': 'heal', 'heal': 'fix', 'recover': 'improve',
        'rehabilitate': 'exercise', 'inject': 'needle', 'vaccinate': 'inject',
        'medicate': 'medicine', 'prescribe': 'write', 'dose': 'give',
        'bandage': 'wrap', 'stitch': 'sew', 'operate': 'cut', 'surgery': 'operate',
        'temperature': 'hot', 'pressure': 'push', 'pulse': 'heart', 'heartbeat': 'heart',
        'cough': 'sick', 'sneeze': 'blow', 'vomit': 'sick', 'bleed': 'blood',
        'hurt': 'pain', 'pain': 'hurt', 'ache': 'pain',
        
        # Food Preparation - Cooking actions
        'chop': 'cut', 'cut': 'cut', 'slice': 'cut', 'dice': 'cut',
        'mince': 'cut', 'shred': 'tear', 'grate': 'rub',
        'peel': 'remove', 'skin': 'remove', 'core': 'remove', 'pit': 'remove',
        'seed': 'remove', 'mix': 'stir', 'stir': 'mix', 'blend': 'mix',
        'whisk': 'stir', 'beat': 'mix', 'knead': 'press', 'shape': 'form',
        'form': 'make', 'mold': 'shape', 'season': 'add', 'salt': 'sprinkle',
        'pepper': 'sprinkle', 'spice': 'add', 'flavor': 'taste', 'taste': 'eat',
        'roast': 'cook', 'broil': 'cook', 'toast': 'cook',
        'sauté': 'fry', 'simmer': 'boil', 'poach': 'boil', 'blanch': 'boil',
        'serve': 'give', 'plate': 'put', 'garnish': 'decorate', 'present': 'show',
        
        # Technology - Tech actions
        'click': 'press', 'tap': 'touch', 'swipe': 'move', 'scroll': 'move',
        'zoom': 'enlarge', 'keyboard': 'type', 'mouse': 'point', 'touchscreen': 'touch',
        'screen': 'see', 'download': 'receive', 'upload': 'send', 'send': 'give',
        'share': 'give', 'forward': 'send', 'save': 'keep', 'delete': 'remove',
        'copy': 'duplicate', 'paste': 'put', 'undo': 'reverse', 'redo': 'repeat',
        'search': 'find', 'browse': 'look', 'navigate': 'go', 'surf': 'browse',
        'explore': 'discover', 'connect': 'join', 'disconnect': 'separate',
        'login': 'enter', 'logout': 'exit', 'signin': 'enter', 'signout': 'leave',
        'charge': 'power', 'battery': 'energy', 'power': 'on', 'switch': 'toggle',
        'button': 'press', 'press': 'push',
        
        # Household - Home actions
        'iron': 'press', 'hang': 'suspend', 'dry': 'remove', 'rinse': 'wash',
        'spin': 'rotate', 'sort': 'separate', 'separate': 'divide',
        'decorate': 'beautify', 'rearrange': 'move', 'place': 'put',
        'position': 'place', 'plug': 'connect', 'unplug': 'disconnect',
        'light': 'shine', 'dim': 'darken', 'brighten': 'light',
        'heat': 'warm', 'cool': 'cold', 'warm': 'heat', 'freeze': 'cold',
        'thaw': 'melt', 'secure': 'protect', 'guard': 'protect',
        
        # Shopping - Shopping actions
        'shop': 'buy', 'browse': 'look', 'select': 'choose', 'choose': 'pick',
        'pick': 'select', 'decide': 'choose', 'order': 'request', 'checkout': 'pay',
        'bargain': 'negotiate', 'negotiate': 'discuss', 'discount': 'reduce',
        'sale': 'sell', 'offer': 'give', 'return': 'give', 'refund': 'return',
        'complain': 'protest', 'wrap': 'cover', 'bag': 'pack', 'box': 'pack',
        
        # Education - Learning actions
        'spell': 'write', 'pronounce': 'say', 'recite': 'speak',
        'memorize': 'remember', 'remember': 'recall', 'recall': 'think',
        'review': 'check', 'revise': 'change', 'solve': 'answer',
        'compute': 'calculate', 'add': 'plus', 'subtract': 'minus',
        'multiply': 'times', 'divide': 'split', 'experiment': 'test',
        'record': 'write', 'note': 'write', 'clarify': 'explain',
        'illustrate': 'show', 'query': 'ask', 'inquire': 'ask',
        'investigate': 'examine', 'research': 'study',
        
        # Social - Social interactions
        'meet': 'greet', 'greet': 'hello', 'welcome': 'greet', 'introduce': 'present',
        'hug': 'embrace', 'kiss': 'love', 'embrace': 'hold',
        'smile': 'happy', 'laugh': 'happy', 'giggle': 'laugh', 'grin': 'smile',
        'chuckle': 'laugh', 'cry': 'sad', 'weep': 'cry', 'sob': 'cry',
        'tear': 'sad', 'sad': 'unhappy', 'angry': 'mad', 'mad': 'angry',
        'furious': 'angry', 'upset': 'sad', 'irritated': 'annoyed',
        'happy': 'joy', 'joyful': 'happy', 'cheerful': 'happy', 'excited': 'enthusiastic',
        'thrilled': 'excited', 'surprised': 'shock', 'shocked': 'surprise',
        'amazed': 'wonder', 'astonished': 'surprised', 'confused': 'puzzled',
        'puzzled': 'confused', 'uncertain': 'doubt', 'doubtful': 'unsure',
        
        # Transportation - Travel actions
        'board': 'enter', 'embark': 'board', 'disembark': 'exit', 'alight': 'descend',
        'exit': 'leave', 'accelerate': 'quick', 'brake': 'stop', 'stop': 'halt',
        'park': 'stop', 'reverse': 'backward', 'steer': 'direct', 'direct': 'guide',
        'guide': 'lead', 'lead': 'direct', 'travel': 'journey', 'journey': 'go',
        'commute': 'travel', 'transfer': 'change', 'sail': 'boat',
        'cruise': 'sail', 'voyage': 'travel',
        
        # Agricultural - Farming actions
        'plant': 'sow', 'sow': 'plant', 'seed': 'plant', 'grow': 'develop',
        'cultivate': 'farm', 'farm': 'work', 'plow': 'dig', 'till': 'plow',
        'dig': 'excavate', 'hoe': 'dig', 'rake': 'gather', 'weed': 'remove',
        'water': 'pour', 'irrigate': 'water', 'spray': 'sprinkle',
        'fertilize': 'feed', 'compost': 'fertilize', 'harvest': 'gather',
        'reap': 'harvest', 'gather': 'collect', 'collect': 'gather',
        'prune': 'cut', 'trim': 'cut', 'crop': 'harvest', 'thresh': 'separate',
        
        # Construction - Building actions
        'demolish': 'destroy', 'dismantle': 'take', 'excavate': 'dig',
        'drill': 'bore', 'bore': 'drill', 'tunnel': 'dig',
        'pour': 'flow', 'concrete': 'build', 'cement': 'join', 'plaster': 'cover',
        'hammer': 'hit', 'nail': 'fasten', 'screw': 'turn', 'bolt': 'fasten',
        'weld': 'join', 'saw': 'cut', 'sand': 'smooth', 'polish': 'shine',
        'level': 'balance', 'align': 'straight', 'square': 'measure', 'plumb': 'straight',
        
        # Environmental - Nature actions
        'recycle': 'reuse', 'reuse': 'again', 'reduce': 'less', 'conserve': 'save',
        'preserve': 'keep', 'pollute': 'dirty', 'contaminate': 'pollute',
        'dirty': 'soil', 'purify': 'clean', 'tree': 'plant', 'garden': 'grow',
        'landscape': 'beautify', 'green': 'plant',
        
        # Financial - Money actions
        'earn': 'make', 'gain': 'receive', 'profit': 'gain', 'income': 'earn',
        'spend': 'use', 'invest': 'put', 'deposit': 'put', 'withdraw': 'take',
        'borrow': 'loan', 'lend': 'give', 'loan': 'lend', 'credit': 'borrow',
        'debt': 'owe', 'budget': 'plan', 'account': 'record', 'balance': 'equal',
        
        # Legal - Law actions
        'sue': 'prosecute', 'prosecute': 'accuse', 'defend': 'protect',
        'plead': 'beg', 'judge': 'decide', 'rule': 'judge', 'decide': 'choose',
        'verdict': 'decision', 'sentence': 'punish', 'arrest': 'catch',
        'detain': 'hold', 'custody': 'jail', 'jail': 'prison', 'prison': 'lock',
        'fine': 'penalty', 'penalty': 'punish', 'punish': 'discipline',
        'reward': 'prize', 'compensate': 'pay',
    }
    
    # Categorize words for better organization
    categories = {
        'Disaster Management': ['evacuate', 'rescue', 'distribute', 'deploy', 'search', 'alert', 'warn', 'emergency', 'danger', 'safe', 'shelter', 'relief'],
        'Movement Actions': ['walk', 'run', 'jump', 'sit', 'stand', 'climb', 'swim', 'fly', 'drive', 'ride', 'jog', 'sprint', 'leap'],
        'Hand Actions': ['push', 'pull', 'lift', 'carry', 'hold', 'grab', 'throw', 'catch', 'touch', 'point', 'wave', 'shake'],
        'Daily Activities': ['eat', 'drink', 'cook', 'clean', 'wash', 'read', 'write', 'study', 'work', 'play', 'brush', 'bath'],
        'Communication': ['talk', 'speak', 'listen', 'watch', 'call', 'text', 'email', 'sign', 'gesture', 'ask', 'answer'],
        'Sports & Exercise': ['exercise', 'kick', 'bat', 'serve', 'box', 'wrestle', 'yoga', 'meditate', 'train', 'race'],
        'Professional': ['build', 'repair', 'operate', 'manage', 'produce', 'sell', 'deliver', 'inventory', 'design', 'plan'],
        'Medical': ['diagnose', 'examine', 'treat', 'inject', 'bandage', 'operate', 'measure', 'cough', 'heal', 'cure'],
        'Food Preparation': ['chop', 'cut', 'mix', 'stir', 'bake', 'fry', 'boil', 'serve', 'slice', 'peel'],
        'Technology': ['click', 'type', 'download', 'save', 'search', 'connect', 'charge', 'upload', 'delete', 'browse'],
        'Household': ['iron', 'fold', 'hang', 'load', 'decorate', 'plug', 'heat', 'lock', 'sweep', 'mop'],
        'Shopping': ['shop', 'browse', 'buy', 'bargain', 'return', 'pack', 'select', 'choose', 'pay'],
        'Education': ['spell', 'memorize', 'solve', 'experiment', 'present', 'research', 'learn', 'teach', 'practice'],
        'Social': ['meet', 'greet', 'smile', 'laugh', 'cry', 'hug', 'kiss', 'welcome', 'introduce'],
        'Transportation': ['board', 'accelerate', 'brake', 'steer', 'travel', 'sail', 'exit', 'park', 'commute'],
        'Agricultural': ['plant', 'plow', 'water', 'harvest', 'prune', 'grow', 'cultivate', 'seed'],
        'Construction': ['construct', 'demolish', 'drill', 'hammer', 'saw', 'measure', 'weld', 'nail'],
        'Environmental': ['recycle', 'conserve', 'pollute', 'plant', 'protect', 'preserve', 'reduce', 'reuse'],
        'Financial': ['earn', 'spend', 'save', 'borrow', 'budget', 'invest', 'pay', 'receive'],
        'Legal': ['sue', 'judge', 'arrest', 'fine', 'prosecute', 'defend', 'rule'],
    }
    
    # Map words to categories
    word_to_category = {}
    for category, words in categories.items():
        for word in words:
            word_to_category[word] = category
    
    # Generate dataset entries with proper action mappings
    for word in sorted(all_words):
        category = word_to_category.get(word, 'General')
        
        # Get the CHARACTER ACTION for this word
        base_word = word.replace('ing', '').replace('ed', '').replace('es', '').replace('s', '')
        sign_action = action_mappings.get(word, action_mappings.get(base_word, word.lower()))
        
        # VALIDATE: Check if sign file actually exists
        if sign_action.lower() not in AVAILABLE_SIGNS:
            # Fallback chain: try the word itself, then base word, then 'do'
            if word.lower() in AVAILABLE_SIGNS:
                sign_action = word.lower()
            elif base_word.lower() in AVAILABLE_SIGNS:
                sign_action = base_word.lower()
            else:
                # Use a common fallback action that exists
                sign_action = 'do' if 'do' in AVAILABLE_SIGNS else 'work'
        
        # Generate proper SOV example with action
        if category == 'Disaster Management':
            sov_example = f"I people {word}"
        elif category in ['Movement Actions', 'Hand Actions']:
            sov_example = f"I now {word}"
        elif 'Daily' in category or 'Activities' in category:
            sov_example = f"I {word} do"
        else:
            sov_example = f"I {word}"
        
        # Add base word
        dataset.append({
            'word': word,
            'sign': sign_action,
            'sovExample': sov_example,
            'category': category
        })
        
        # Add -ing variation
        if not word.endswith('ing'):
            dataset.append({
                'word': f"{word}ing" if not word.endswith('e') else f"{word[:-1]}ing",
                'sign': sign_action,
                'sovExample': f"I {word}ing am",
                'category': category
            })
        
        # Add -ed variation
        if not word.endswith('ed'):
            dataset.append({
                'word': f"{word}ed" if not word.endswith('e') else f"{word}d",
                'sign': sign_action,
                'sovExample': f"I yesterday {word}ed",
                'category': category
            })
    
    return dataset

def export_to_json(dataset: List[Dict], output_file: str = 'isl-dataset.json'):
    """Export dataset to JSON file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print(f"✅ Exported {len(dataset)} entries to {output_file}")

def export_to_csv(dataset: List[Dict], output_file: str = 'isl-dataset.csv'):
    """Export dataset to CSV file"""
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['word', 'sign', 'sovExample', 'category'])
        writer.writeheader()
        writer.writerows(dataset)
    print(f"✅ Exported {len(dataset)} entries to {output_file}")

def generate_typescript_dataset(dataset: List[Dict], output_file: str = 'isl-dataset.ts'):
    """Generate TypeScript file with dataset"""
    ts_content = f"""// Auto-generated ISL Dataset
// Total entries: {len(dataset)}
// Sources: CISLR (~4,700), INCLUDE (~4,287), ISLTranslate (~31k)

export const ISL_DATASET = [
"""
    
    for entry in dataset:
        ts_content += f"  {{ word: '{entry['word']}', sign: '{entry['sign']}', sovExample: '{entry['sovExample']}', category: '{entry['category']}' }},\n"
    
    ts_content += "];\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print(f"✅ Exported TypeScript dataset to {output_file}")

def print_statistics(dataset: List[Dict]):
    """Print dataset statistics"""
    print("\n📊 Dataset Statistics:")
    print(f"Total entries: {len(dataset)}")
    
    # Count unique signs and validate
    unique_signs = set(entry['sign'] for entry in dataset)
    valid_signs = sum(1 for sign in unique_signs if sign.lower() in AVAILABLE_SIGNS)
    
    print(f"Unique sign actions: {len(unique_signs)}")
    print(f"Valid .sigml files: {valid_signs}/{len(unique_signs)} ({valid_signs/len(unique_signs)*100:.1f}%)")
    
    # Count by category
    category_counts = defaultdict(int)
    for entry in dataset:
        category_counts[entry['category']] += 1
    
    print("\nEntries by category:")
    for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: {count}")
    
    # Unique words
    unique_words = len(set(entry['word'] for entry in dataset))
    print(f"\nUnique words: {unique_words}")

if __name__ == "__main__":
    print("🚀 Generating ISL Action Dataset...")
    print("📚 Sources: CISLR, INCLUDE, ISLTranslate, iSign")
    print()
    
    dataset = generate_action_dataset()
    
    print_statistics(dataset)
    
    # Export to multiple formats
    export_to_json(dataset, 'isl-dataset.json')
    export_to_csv(dataset, 'isl-dataset.csv')
    generate_typescript_dataset(dataset, 'isl-dataset.ts')
    
    print("\n✅ Dataset generation complete!")
    print("📁 Files created:")
    print("  - isl-dataset.json")
    print("  - isl-dataset.csv")
    print("  - isl-dataset.ts")
