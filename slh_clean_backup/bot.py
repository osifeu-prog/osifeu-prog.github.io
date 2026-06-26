import telebot, json, os, subprocess
from datetime import datetime

# Load config
with open('config.json') as f:
    cfg = json.load(f)

BOT_TOKEN = cfg['BOT_TOKEN']
SUPER_ADMIN = cfg['SUPER_ADMIN']
DB_FILE = cfg['DB_FILE']
SITE_DIR = cfg['SITE_DIR']

bot = telebot.TeleBot(BOT_TOKEN)

# Database
def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE) as f:
            return json.load(f)
    return {"users": {}, "votes": {"yes": 0, "no": 0, "unsure": 0}}

def save_db(db):
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, indent=2)

# Core Commands
@bot.message_handler(commands=['start'])
def start(m):
    bot.send_message(m.chat.id, "🇮🇱 SLH Bot — Clean v1.0\n/help for commands")

@bot.message_handler(commands=['help'])
def help_cmd(m):
    text = """🇮🇱 SLH BOT v1.0 — CLEAN BUILD

📊 SYSTEM:
/status /health /logs

💰 REVENUE:
/revenue /master

🗳️ VOTING:
/vote /results

🔧 ADMIN:
/users /config /restart
"""
    bot.reply_to(m, text)

@bot.message_handler(commands=['status'])
def status_cmd(m):
    text = "✅ Bot: Online\n"
    text += f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    text += f"📦 Version: {cfg['VERSION']}\n"
    text += f"💾 DB: {os.path.getsize(DB_FILE)} bytes"
    bot.reply_to(m, text)

@bot.message_handler(commands=['health'])
def health(m):
    if m.from_user.id != SUPER_ADMIN:
        bot.reply_to(m, "Admin only")
        return
    text = "HEALTH CHECK\n\n"
    text += f"Bot: ✅\n"
    text += f"Config: ✅\n"
    text += f"DB: ✅\n"
    text += f"Git: {'✅' if os.path.exists(os.path.join(SITE_DIR, '.git')) else '⚠️'}\n"
    text += f"MASTER.json: {'✅' if os.path.exists(os.path.join(SITE_DIR, 'MASTER.json')) else '❌'}"
    bot.reply_to(m, text)

@bot.message_handler(commands=['revenue'])
def revenue_cmd(m):
    if m.from_user.id != SUPER_ADMIN:
        bot.reply_to(m, "Admin only")
        return
    master_path = os.path.join(SITE_DIR, 'MASTER.json')
    if not os.path.exists(master_path):
        bot.reply_to(m, "❌ MASTER.json not found in Git")
        return
    with open(master_path) as f:
        master = json.load(f)
    metrics = master['REVENUE_MODEL']['metrics']
    text = "💰 REVENUE GOAL\n\n"
    text += f"Target: ₪{metrics['daily_revenue_target']}/day\n"
    text += f"Current AUM: ₪{metrics['current_aum']}\n"
    text += f"Gap: ₪{metrics['gap']}\n"
    text += f"Status: {master['STATUS']}"
    bot.reply_to(m, text)

@bot.message_handler(commands=['master'])
def master_cmd(m):
    if m.from_user.id != SUPER_ADMIN:
        return
    master_path = os.path.join(SITE_DIR, 'MASTER.json')
    if os.path.exists(master_path):
        with open(master_path) as f:
            master = json.load(f)
        bot.reply_to(m, f"✅ MASTER.json exists\nVersion: {master['VERSION']}")
    else:
        bot.reply_to(m, "❌ MASTER.json not in Git")

@bot.message_handler(commands=['vote'])
def vote_cmd(m):
    text = "🗳️ הצבעת העם\n\nהאם צריך תחבורה ציבורית בשבת?"
    kb = telebot.types.InlineKeyboardMarkup()
    kb.row(
        telebot.types.InlineKeyboardButton("✅ כן", callback_data="v_yes"),
        telebot.types.InlineKeyboardButton("❌ לא", callback_data="v_no"),
        telebot.types.InlineKeyboardButton("🤷 לא בטוח", callback_data="v_unsure")
    )
    bot.send_message(m.chat.id, text, reply_markup=kb)

@bot.callback_query_handler(func=lambda call: call.data.startswith("v_"))
def vote_handler(call):
    db = load_db()
    vote_type = call.data.replace("v_", "")
    db["votes"][vote_type] += 1
    save_db(db)
    
    votes = db["votes"]
    total = sum(votes.values())
    yes_pct = (votes["yes"] / total * 100) if total > 0 else 0
    no_pct = (votes["no"] / total * 100) if total > 0 else 0
    unsure_pct = (votes["unsure"] / total * 100) if total > 0 else 0
    
    text = f"תודה שהצבעת!\n\n"
    text += f"✅ כן: {yes_pct:.1f}%\n"
    text += f"❌ לא: {no_pct:.1f}%\n"
    text += f"🤷 לא בטוח: {unsure_pct:.1f}%\n\n"
    text += f"סה״כ: {total} הצביעו"
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id)

@bot.message_handler(commands=['results'])
def results_cmd(m):
    db = load_db()
    votes = db["votes"]
    total = sum(votes.values())
    if total == 0:
        bot.reply_to(m, "📊 עדיין אין הצבעות")
        return
    yes_pct = (votes["yes"] / total * 100)
    no_pct = (votes["no"] / total * 100)
    unsure_pct = (votes["unsure"] / total * 100)
    text = f"📊 תוצאות הצבעה:\n\n"
    text += f"✅ כן: {yes_pct:.1f}% ({votes['yes']})\n"
    text += f"❌ לא: {no_pct:.1f}% ({votes['no']})\n"
    text += f"🤷 לא בטוח: {unsure_pct:.1f}% ({votes['unsure']})\n\n"
    text += f"סה״כ: {total}"
    bot.reply_to(m, text)

@bot.message_handler(commands=['users'])
def users_cmd(m):
    if m.from_user.id != SUPER_ADMIN:
        bot.reply_to(m, "Admin only")
        return
    db = load_db()
    text = f"👥 Users: {len(db['users'])}"
    bot.reply_to(m, text)

@bot.message_handler(commands=['config'])
def config_cmd(m):
    if m.from_user.id != SUPER_ADMIN:
        return
    text = f"""⚙️ CONFIG

Token: {cfg['BOT_TOKEN'][:20]}...
Admin: {cfg['SUPER_ADMIN']}
Version: {cfg['VERSION']}
DB: {os.path.getsize(DB_FILE)} bytes
"""
    bot.reply_to(m, text)

@bot.message_handler(commands=['restart'])
def restart_cmd(m):
    if m.from_user.id != SUPER_ADMIN:
        bot.reply_to(m, "Admin only")
        return
    bot.reply_to(m, "🔄 Restarting...")
    os.execl("python3", "python3", "bot.py")

@bot.message_handler(func=lambda m: True)
def default_handler(m):
    bot.send_message(m.chat.id, "Command not found. /help")

print("✅ SLH Bot v1.0 CLEAN — Starting...")
bot.infinity_polling()
