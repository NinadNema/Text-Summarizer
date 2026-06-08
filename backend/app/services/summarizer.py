from transformers import pipeline
import yake
import nltk
import json

# FIX: Download both punkt and punkt_tab (required by NLTK 3.9+)
for resource in ['punkt', 'punkt_tab']:
    try:
        nltk.data.find(f'tokenizers/{resource}')
    except LookupError:
        nltk.download(resource)

from nltk.tokenize import sent_tokenize
from app.database import cursor, conn

# LOAD MODEL
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)

keyword_extractor = yake.KeywordExtractor(
    lan="en",
    n=2,
    dedupLim=0.7,
    top=10,
    features=None
)

# CHUNK TEXT
def chunk_text(text, chunk_size=150):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = ""
    current_length = 0

    for sentence in sentences:
        sentence_words = len(sentence.split())
        if current_length + sentence_words <= chunk_size:
            current_chunk += " " + sentence
            current_length += sentence_words
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = sentence
            current_length = sentence_words

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks

# RESEARCH PAPER SECTION FILTER
def extract_research_sections(text):
    sections = [
        "abstract", "introduction", "methodology",
        "methods", "results", "discussion", "conclusion"
    ]
    important_content = []
    paragraphs = text.split("\n")
    for para in paragraphs:
        para_lower = para.lower()
        for section in sections:
            if section in para_lower:
                important_content.append(para)
                break

    if not important_content:
        return text
    return " ".join(important_content)

# CLEAN TEXT
def clean_text(text):
    text = text.replace("\n", " ")
    text = text.replace("\t", " ")
    text = text.replace("#", "")
    text = " ".join(text.split())
    return text

# GET LENGTH SETTINGS PER CHUNK + TARGET FINAL WORD COUNT
def get_length_settings(length, word_count_input):
    if length == "short":
        chunk_max   = 80
        chunk_min   = 40
        target_words = max(80, word_count_input // 8)
    elif length == "long":
        chunk_max   = 250
        chunk_min   = 100
        target_words = max(300, word_count_input // 3)
    else:  # medium
        chunk_max   = 150
        chunk_min   = 60
        target_words = max(150, word_count_input // 5)

    return chunk_max, chunk_min, target_words

# GENERATE SUMMARY
def generate_summary(text, length="medium", mode="normal"):

    # SUMMARY MODES
    if mode == "academic":
        text = "Provide academic summary: " + text
    elif mode == "simple":
        text = "Explain in simple words: " + text
    elif mode == "research":
        research_text = extract_research_sections(text)
        text = (
            "Summarize research paper including "
            "objective, methodology, findings, conclusion: "
            + research_text
        )

    # CLEAN TEXT
    text = clean_text(text)

    # If text is too short to summarize, return it directly
    word_count_input = len(text.split())
    if word_count_input < 20:
        return text.strip()

    # GET LENGTH SETTINGS
    chunk_max, chunk_min, target_words = get_length_settings(
        length, word_count_input
    )

    # CHUNKING — split into 150-word chunks
    chunks = chunk_text(text, chunk_size=150)
    chunk_summaries = []

    for chunk in chunks:
        chunk_words = len(chunk.split())

        if chunk_words < 20:
            # Too short for BART — keep as-is
            chunk_summaries.append(chunk)
            continue

        try:
            # Cap max to chunk size so BART does not error
            dynamic_max = min(chunk_max, chunk_words - 1)
            dynamic_min = min(chunk_min, max(10, dynamic_max // 2))

            result = summarizer(
                chunk,
                max_length=dynamic_max,
                min_length=dynamic_min,
                do_sample=False
            )
            chunk_summaries.append(result[0]['summary_text'])

        except Exception as e:
            print(f"Chunk Error: {e}")
            chunk_summaries.append(chunk)

    if not chunk_summaries:
        return text[:500]

    # KEY FIX: Join all chunk summaries WITHOUT recursive compression
    # Recursive compression was squashing everything into 50 words
    full_summary = " ".join(chunk_summaries)

    # TRIM to target word count sentence by sentence
    # This keeps output readable and correctly sized
    sentences = sent_tokenize(full_summary)
    final_sentences = []
    current_words = 0

    for sentence in sentences:
        sentence_words = len(sentence.split())
        if current_words + sentence_words <= target_words:
            final_sentences.append(sentence)
            current_words += sentence_words
        else:
            # For long mode always include at least 3 sentences
            if length == "long" and len(final_sentences) < 3:
                final_sentences.append(sentence)
                current_words += sentence_words
            else:
                break

    # Edge case: nothing selected
    if not final_sentences:
        return full_summary

    return " ".join(final_sentences)


# BULLET SUMMARY
def generate_bullet_summary(summary):
    sentences = sent_tokenize(summary)
    bullets = []
    seen = set()
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence in seen:
            continue
        seen.add(sentence)
        word_count = len(sentence.split())
        if 8 <= word_count <= 35:
            bullets.append(sentence)
    return bullets[:10]

# KEYWORDS
def extract_keywords(text):
    text = clean_text(text)
    keywords = keyword_extractor.extract_keywords(text)
    keyword_list = []
    stop_words = {
        "paper", "research", "study",
        "method", "result", "system"
    }
    for kw in keywords:
        keyword = kw[0].strip()
        if keyword.lower() in stop_words:
            continue
        if len(keyword.split()) < 1:
            continue
        keyword_list.append(keyword)
    return keyword_list[:8]

# IMPORTANT SENTENCES
def important_sentences(text):
    text = clean_text(text)
    sentences = sent_tokenize(text)

    if len(sentences) <= 3:
        return sentences

    keywords = extract_keywords(text)
    scored_sentences = []

    for sentence in sentences:
        score = 0
        sentence_lower = sentence.lower()
        for keyword in keywords:
            if keyword.lower() in sentence_lower:
                score += 1
        word_count = len(sentence.split())
        if 10 <= word_count <= 40:
            score += 2
        scored_sentences.append((score, sentence))

    scored_sentences.sort(reverse=True, key=lambda x: x[0])

    return [s.strip() for _, s in scored_sentences[:5]]



#Save Summary
def save_summary(original_text, summary, mode, length, user_id,
                    bullets=None, keywords=None, important_sentences=None):
        cursor.execute(
            '''
            INSERT INTO summaries (
                original_text, summary, mode, length, user_id,
                bullets, keywords, important_sentences
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                original_text, summary, mode, length, user_id,
                json.dumps(bullets or []),
                json.dumps(keywords or []),
                json.dumps(important_sentences or [])
            )
        )
        conn.commit()

# GET HISTORY — returns bullets, keywords, important_sentences too
def get_summary_history(user_id):
    cursor.execute(
        '''
        SELECT id, original_text, summary, mode, length,
               created_at, user_id, favorite,
               bullets, keywords, important_sentences
        FROM summaries
        WHERE user_id = ?
        ORDER BY created_at DESC
        ''',
        (user_id,)
    )
    rows = cursor.fetchall()
    history = []
    for row in rows:
        history.append({
            "id":                   row["id"],
            "original_text":        row["original_text"],
            "summary":              row["summary"],
            "mode":                 row["mode"],
            "length":               row["length"],
            "created_at":           row["created_at"],
            "favorite":             row["favorite"],
            "bullets":              json.loads(row["bullets"] or "[]"),
            "keywords":             json.loads(row["keywords"] or "[]"),
            "important_sentences":  json.loads(row["important_sentences"] or "[]"),
        })
    return history