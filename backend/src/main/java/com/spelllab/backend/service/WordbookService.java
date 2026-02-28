package com.spelllab.backend.service;

import com.spelllab.backend.entity.Chapter;
import com.spelllab.backend.entity.ChapterProgressEntity;
import com.spelllab.backend.entity.Word;
import com.spelllab.backend.entity.Wordbook;
import com.spelllab.backend.dto.ChapterDto;
import com.spelllab.backend.dto.WordDto;
import com.spelllab.backend.dto.WordbookDto;
import com.spelllab.backend.repository.ChapterProgressRepository;
import com.spelllab.backend.repository.ChapterRepository;
import com.spelllab.backend.repository.TrainingRepository;
import com.spelllab.backend.repository.WordRepository;
import com.spelllab.backend.repository.WordbookRepository;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class WordbookService {
    private final WordbookRepository wordbookRepository;
    private final ChapterRepository chapterRepository;
    private final WordRepository wordRepository;
    private final TrainingRepository trainingRepository;
    private final ChapterProgressRepository chapterProgressRepository;

    public WordbookService(
            WordbookRepository wordbookRepository,
            ChapterRepository chapterRepository,
            WordRepository wordRepository,
            TrainingRepository trainingRepository,
            ChapterProgressRepository chapterProgressRepository
    ) {
        this.wordbookRepository = wordbookRepository;
        this.chapterRepository = chapterRepository;
        this.wordRepository = wordRepository;
        this.trainingRepository = trainingRepository;
        this.chapterProgressRepository = chapterProgressRepository;
    }

    @PostConstruct
    public void init() {
        removeLegacySystemWordbook("雅思核心词书");
        List<SystemWordbookSpec> specs = List.of(
                new SystemWordbookSpec("雅思词汇", Paths.get("books", "雅思词汇.csv")),
                new SystemWordbookSpec("托福词汇", Paths.get("books", "托福词汇.xls")),
                new SystemWordbookSpec("四级词汇", Paths.get("books", "四级词汇.xls")),
                new SystemWordbookSpec("六级词汇", Paths.get("books", "六级词汇.xls"))
        );
        for (SystemWordbookSpec spec : specs) {
            ensureSystemWordbook(spec);
        }
    }

    @Transactional
    private void removeLegacySystemWordbook(String name) {
        Optional<Wordbook> existing = wordbookRepository.findByNameAndType(name, "system");
        if (existing.isEmpty()) {
            return;
        }
        Wordbook book = existing.get();
        clearWordbookContent(book);
        wordbookRepository.delete(book);
    }

    @Transactional
    private void ensureSystemWordbook(SystemWordbookSpec spec) {
        Optional<Wordbook> existing = wordbookRepository.findByNameAndType(spec.name(), "system");
        if (existing.isPresent() && existing.get().getTotalWords() > 0) {
            return;
        }
        if (!Files.exists(spec.path())) {
            throw new IllegalStateException("词书文件不存在: " + spec.path());
        }
        Wordbook book = existing.orElseGet(() -> wordbookRepository.save(new Wordbook(spec.name(), "system", null)));
        if (book.getTotalWords() == 0) {
            clearWordbookContent(book);
        }
        List<Word> parsedWords = parseWordbookFile(spec.path());
        if (parsedWords.isEmpty()) {
            return;
        }
        saveWordsToBook(book, parsedWords);
    }

    private void clearWordbookContent(Wordbook book) {
        List<Chapter> chapters = chapterRepository.findByWordbookIdOrderByOrderNo(book.getId());
        if (chapters.isEmpty()) {
            return;
        }
        List<Word> words = new ArrayList<>();
        for (Chapter chapter : chapters) {
            words.addAll(wordRepository.findByChapterId(chapter.getId()));
        }
        if (!words.isEmpty()) {
            wordRepository.deleteAll(words);
        }
        chapterRepository.deleteAll(chapters);
        book.setTotalWords(0);
        wordbookRepository.save(book);
    }

    private List<Word> parseWordbookFile(Path path) {
        String lower = path.getFileName().toString().toLowerCase();
        try {
            if (lower.endsWith(".csv")) {
                return parseCsvPath(path);
            }
            if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
                return parseExcelPath(path);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("词书解析失败: " + path + "，原因: " + e.getMessage(), e);
        }
        throw new IllegalArgumentException("不支持的词书格式: " + path);
    }

    private List<Word> parseCsvPath(Path path) throws Exception {
        List<Charset> charsets = List.of(StandardCharsets.UTF_8, Charset.forName("GBK"));
        Exception lastException = null;
        for (Charset charset : charsets) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(Files.newInputStream(path), charset))) {
                return parseCsvReader(reader, null);
            } catch (Exception e) {
                lastException = e;
            }
        }
        if (lastException != null) {
            throw lastException;
        }
        return List.of();
    }

    private List<Word> parseExcelPath(Path path) throws Exception {
        try (InputStream inputStream = Files.newInputStream(path);
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            boolean firstRow = true;
            HeaderIndexes headerIndexes = null;
            List<Word> words = new ArrayList<>();
            for (Row row : sheet) {
                if (firstRow) {
                    List<String> headerValues = new ArrayList<>();
                    int lastCell = row.getLastCellNum();
                    for (int i = 0; i < lastCell; i++) {
                        headerValues.add(formatter.formatCellValue(row.getCell(i)));
                    }
                    headerIndexes = resolveHeaderIndexes(headerValues);
                    if (!headerIndexes.isHeader) {
                        addWordFromRow(row, formatter, headerIndexes, null, words);
                    }
                    firstRow = false;
                    continue;
                }
                addWordFromRow(row, formatter, headerIndexes, null, words);
            }
            return words;
        }
    }

    private void saveWordsToBook(Wordbook book, List<Word> allParsedWords) {
        int batchSize = 50;
        List<Word> batch = new ArrayList<>();
        int chapterIndex = 1;
        for (int i = 0; i < allParsedWords.size(); i++) {
            batch.add(allParsedWords.get(i));
            if (batch.size() == batchSize || i == allParsedWords.size() - 1) {
                Chapter newChapter = new Chapter(book.getId(), "第" + chapterIndex + "节", chapterIndex);
                newChapter.setTotalWords(batch.size());
                chapterRepository.save(newChapter);
                for (Word w : batch) {
                    w.setChapterId(newChapter.getId());
                }
                wordRepository.saveAll(batch);
                batch.clear();
                chapterIndex++;
            }
        }
        book.setTotalWords(allParsedWords.size());
        wordbookRepository.save(book);
    }

    private record SystemWordbookSpec(String name, Path path) {
    }

    public List<WordbookDto> listWordbooks(Long userId) {
        List<Wordbook> books = wordbookRepository.findByUserIdOrType(userId, "system");
        return books.stream()
                .map(b -> new WordbookDto(b.getId(), b.getName(), b.getType(), b.getTotalWords()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ChapterDto> listChapters(Long wordbookId, Long userId) {
        List<Chapter> chapters = chapterRepository.findByWordbookIdOrderByOrderNo(wordbookId);
        boolean updated = false;
        if (chapters.size() == 1) {
            updated = ensureSectionChapters(chapters.get(0));
        }
        if (updated) {
            chapters = chapterRepository.findByWordbookIdOrderByOrderNo(wordbookId);
        }
        Map<Long, ChapterProgressEntity> progressMap;
        if (userId != null && !chapters.isEmpty()) {
            List<Long> chapterIds = chapters.stream().map(Chapter::getId).toList();
            progressMap = chapterProgressRepository.findAllByUserIdAndChapterIdIn(userId, chapterIds)
                    .stream()
                    .collect(Collectors.toMap(ChapterProgressEntity::getChapterId, entity -> entity, (a, b) -> a));
        } else {
            progressMap = Map.of();
        }
        return chapters.stream()
                .map(c -> {
                    ChapterProgressEntity progress = progressMap.get(c.getId());
                    int answeredCount = progress == null ? 0 : Math.min(progress.getAnsweredCount(), c.getTotalWords());
                    int correctCount = progress == null ? 0 : Math.min(progress.getCorrectCount(), answeredCount);
                    String status = answeredCount == 0
                            ? "not_started"
                            : answeredCount >= c.getTotalWords() ? "completed" : "in_progress";
                    double correctRate = answeredCount == 0 ? 0 : (correctCount * 100.0 / answeredCount);
                    return new ChapterDto(
                            c.getId(),
                            c.getName(),
                            c.getOrderNo(),
                            c.getTotalWords(),
                            status,
                            answeredCount,
                            correctRate,
                            answeredCount,
                            correctCount
                    );
                })
                .collect(Collectors.toList());
    }

    private boolean ensureSectionChapters(Chapter chapter) {
        List<Word> words = wordRepository.findByChapterIdOrderByIdAsc(chapter.getId());
        int total = words.size();
        boolean updated = false;
        if (total <= 50) {
            if (!"第1节".equals(chapter.getName()) || chapter.getOrderNo() != 1 || chapter.getTotalWords() != total) {
                chapter.setName("第1节");
                chapter.setOrderNo(1);
                chapter.setTotalWords(total);
                chapterRepository.save(chapter);
                updated = true;
            }
            return updated;
        }
        int batchSize = 50;
        if (!"第1节".equals(chapter.getName()) || chapter.getOrderNo() != 1 || chapter.getTotalWords() != batchSize) {
            chapter.setName("第1节");
            chapter.setOrderNo(1);
            chapter.setTotalWords(batchSize);
            chapterRepository.save(chapter);
            updated = true;
        }
        int start = batchSize;
        int sectionIndex = 2;
        while (start < total) {
            int end = Math.min(start + batchSize, total);
            Chapter newChapter = new Chapter(chapter.getWordbookId(), "第" + sectionIndex + "节", sectionIndex);
            newChapter.setTotalWords(end - start);
            chapterRepository.save(newChapter);
            List<Word> batch = new ArrayList<>();
            for (int i = start; i < end; i++) {
                Word word = words.get(i);
                word.setChapterId(newChapter.getId());
                batch.add(word);
            }
            wordRepository.saveAll(batch);
            updated = true;
            sectionIndex++;
            start = end;
        }
        return updated;
    }

    public Map<String, Object> listWords(Long chapterId, int page, int size) {
        int safePage = page <= 0 ? 1 : page;
        int safeSize = size <= 0 ? 50 : size;
        Page<Word> pageResult = wordRepository.findByChapterId(
                chapterId,
                PageRequest.of(safePage - 1, safeSize, Sort.by("id").ascending())
        );
        List<WordDto> items = pageResult.getContent().stream()
                .map(w -> new WordDto(
                        w.getId(),
                        w.getText(),
                        w.getPronunciation(),
                        w.getAudioUrl(),
                        trainingRepository.isFamiliar(w.getId()),
                        List.of(w.getMeaning() != null ? w.getMeaning().split(";") : new String[]{})
                ))
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", pageResult.getTotalElements());
        result.put("totalPages", pageResult.getTotalPages());
        return result;
    }

    public WordDto searchWord(Long wordbookId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        List<Chapter> chapters = chapterRepository.findByWordbookIdOrderByOrderNo(wordbookId);
        if (chapters.isEmpty()) {
            return null;
        }
        List<Long> chapterIds = chapters.stream().map(Chapter::getId).toList();
        Optional<Word> found = wordRepository.findFirstByChapterIdInAndTextIgnoreCaseOrderByIdAsc(
                chapterIds,
                keyword.trim()
        );
        if (found.isEmpty()) {
            return null;
        }
        Word w = found.get();
        return new WordDto(
                w.getId(),
                w.getText(),
                w.getPronunciation(),
                w.getAudioUrl(),
                trainingRepository.isFamiliar(w.getId()),
                List.of(w.getMeaning() != null ? w.getMeaning().split(";") : new String[]{})
        );
    }

    @Transactional
    public WordbookDto createCustomWordbook(Long userId, String name) {
        Wordbook book = new Wordbook(name, "custom", userId);
        wordbookRepository.save(book);
        
        Chapter chapter = new Chapter(book.getId(), "第1节", 1);
        chapterRepository.save(chapter);
        
        return new WordbookDto(book.getId(), book.getName(), book.getType(), 0);
    }

    @Transactional
    public void importWords(Long wordbookId, MultipartFile file) {
        Wordbook book = wordbookRepository.findById(wordbookId)
                .orElseThrow(() -> new IllegalArgumentException("词书不存在"));

        // 临时存储所有解析出的单词
        List<Word> allParsedWords = new ArrayList<>();
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IllegalArgumentException("文件名不能为空");
        }
        String lowerFilename = filename.toLowerCase();

        try {
            if (lowerFilename.endsWith(".csv")) {
                allParsedWords.addAll(parseCsv(file, null)); // 暂不指定 chapterId
            } else if (lowerFilename.endsWith(".xls") || lowerFilename.endsWith(".xlsx")) {
                allParsedWords.addAll(parseExcel(file, null)); // 暂不指定 chapterId
            } else {
                throw new IllegalArgumentException("不支持的文件格式，请上传 .csv 或 .xlsx 文件");
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("文件解析失败: " + e.getMessage());
        }

        if (allParsedWords.isEmpty()) {
            return;
        }

        // 获取当前已有章节数，以便继续编号
        List<Chapter> existingChapters = chapterRepository.findByWordbookIdOrderByOrderNo(wordbookId);
        int currentChapterCount = existingChapters.size();
        
        // 如果存在默认章节且该章节为空，则复用该章节（通常是刚创建的空词书）
        // 简单起见，如果只有一个章节且无单词，我们视为空书
        if (currentChapterCount == 1 && existingChapters.get(0).getTotalWords() == 0) {
            chapterRepository.delete(existingChapters.get(0));
            existingChapters.clear();
            currentChapterCount = 0;
        }

        // 按50个单词分块
        int batchSize = 50;
        List<Word> batch = new ArrayList<>();
        int chapterIndex = currentChapterCount + 1;

        for (int i = 0; i < allParsedWords.size(); i++) {
            batch.add(allParsedWords.get(i));
            
            if (batch.size() == batchSize || i == allParsedWords.size() - 1) {
                // 创建新章节
                String chapterName = "第" + chapterIndex + "节"; // 或者 "Section " + chapterIndex
                Chapter newChapter = new Chapter(book.getId(), chapterName, chapterIndex);
                newChapter.setTotalWords(batch.size());
                chapterRepository.save(newChapter);

                // 更新单词的 chapterId 并保存
                for (Word w : batch) {
                    w.setChapterId(newChapter.getId());
                }
                wordRepository.saveAll(batch);

                batch.clear();
                chapterIndex++;
            }
        }

        // 更新词书总词数
        book.setTotalWords(book.getTotalWords() + allParsedWords.size());
        wordbookRepository.save(book);
    }

    private List<Word> parseCsv(MultipartFile file, Long chapterId) throws Exception {
        List<Charset> charsets = List.of(StandardCharsets.UTF_8, Charset.forName("GBK"));
        Exception lastException = null;
        for (Charset charset : charsets) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), charset))) {
                return parseCsvReader(reader, chapterId);
            } catch (Exception e) {
                lastException = e;
            }
        }
        if (lastException != null) {
            throw lastException;
        }
        return List.of();
    }

    private List<Word> parseCsvReader(BufferedReader reader, Long chapterId) throws Exception {
        List<Word> words = new ArrayList<>();
        try (CSVParser parser = CSVFormat.DEFAULT.parse(reader)) {
            var iterator = parser.iterator();
            if (!iterator.hasNext()) {
                return words;
            }
            CSVRecord first = iterator.next();
            HeaderIndexes headerIndexes = resolveHeaderIndexes(first);
            if (!headerIndexes.isHeader) {
                addWordFromCsv(first, headerIndexes, chapterId, words);
            }
            while (iterator.hasNext()) {
                addWordFromCsv(iterator.next(), headerIndexes, chapterId, words);
            }
        }
        return words;
    }

    private List<Word> parseExcel(MultipartFile file, Long chapterId) throws Exception {
        List<Word> words = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            boolean firstRow = true;
            HeaderIndexes headerIndexes = null;
            for (Row row : sheet) {
                if (firstRow) {
                    List<String> headerValues = new ArrayList<>();
                    int lastCell = row.getLastCellNum();
                    for (int i = 0; i < lastCell; i++) {
                        headerValues.add(formatter.formatCellValue(row.getCell(i)));
                    }
                    headerIndexes = resolveHeaderIndexes(headerValues);
                    if (!headerIndexes.isHeader) {
                        addWordFromRow(row, formatter, headerIndexes, chapterId, words);
                    }
                    firstRow = false;
                    continue;
                }
                addWordFromRow(row, formatter, headerIndexes, chapterId, words);
            }
        }
        return words;
    }

    private void addWordFromCsv(CSVRecord record, HeaderIndexes indexes, Long chapterId, List<Word> words) {
        String text = readCell(record, indexes.wordIndex);
        if (text.isEmpty()) {
            return;
        }
        String meaning = readCell(record, indexes.meaningIndex);
        String phonetic = readCell(record, indexes.phoneticIndex);
        if (phonetic.isEmpty()) {
            phonetic = findPhonetic(record);
        }
        words.add(new Word(chapterId, text, phonetic, meaning));
    }

    private void addWordFromRow(Row row, DataFormatter formatter, HeaderIndexes indexes, Long chapterId, List<Word> words) {
        String text = readCell(row, formatter, indexes.wordIndex);
        if (text.isEmpty()) {
            return;
        }
        String meaning = readCell(row, formatter, indexes.meaningIndex);
        String phonetic = readCell(row, formatter, indexes.phoneticIndex);
        if (phonetic.isEmpty()) {
            phonetic = findPhonetic(row, formatter);
        }
        words.add(new Word(chapterId, text, phonetic, meaning));
    }

    private HeaderIndexes resolveHeaderIndexes(CSVRecord record) {
        List<String> values = new ArrayList<>();
        for (int i = 0; i < record.size(); i++) {
            values.add(record.get(i));
        }
        return resolveHeaderIndexes(values);
    }

    private HeaderIndexes resolveHeaderIndexes(List<String> values) {
        int wordIndex = -1;
        int meaningIndex = -1;
        int phoneticIndex = -1;
        boolean isHeader = false;
        for (int i = 0; i < values.size(); i++) {
            String normalized = normalizeHeader(values.get(i));
            if (normalized.isEmpty()) {
                continue;
            }
            if (normalized.equals("word") || normalized.equals("单词")) {
                wordIndex = i;
                isHeader = true;
            } else if (normalized.equals("meaning") || normalized.equals("释义")) {
                meaningIndex = i;
                isHeader = true;
            } else if (normalized.equals("phonetic") || normalized.equals("音标") || normalized.equals("pronunciation")) {
                phoneticIndex = i;
                isHeader = true;
            } else if (normalized.equals("title") || normalized.equals("chapter") || normalized.equals("sort")) {
                isHeader = true;
            }
        }
        if (!isHeader) {
            return new HeaderIndexes(false, 0, 1, 2);
        }
        if (wordIndex < 0) {
            wordIndex = 0;
        }
        if (meaningIndex < 0) {
            meaningIndex = 1;
        }
        if (phoneticIndex < 0) {
            phoneticIndex = 2;
        }
        return new HeaderIndexes(true, wordIndex, meaningIndex, phoneticIndex);
    }

    private String normalizeHeader(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.startsWith("\uFEFF")) {
            trimmed = trimmed.substring(1);
        }
        return trimmed.toLowerCase();
    }

    private String readCell(CSVRecord record, int index) {
        if (index < 0 || index >= record.size()) {
            return "";
        }
        return record.get(index).trim();
    }

    private String readCell(Row row, DataFormatter formatter, int index) {
        if (index < 0 || index >= row.getLastCellNum()) {
            return "";
        }
        return formatter.formatCellValue(row.getCell(index)).trim();
    }

    private String findPhonetic(CSVRecord record) {
        for (int i = record.size() - 1; i >= 0; i--) {
            String value = record.get(i).trim();
            if (value.startsWith("/") && value.endsWith("/")) {
                return value;
            }
        }
        return "";
    }

    private String findPhonetic(Row row, DataFormatter formatter) {
        for (int i = row.getLastCellNum() - 1; i >= 0; i--) {
            String value = formatter.formatCellValue(row.getCell(i)).trim();
            if (value.startsWith("/") && value.endsWith("/")) {
                return value;
            }
        }
        return "";
    }

    private static class HeaderIndexes {
        private final boolean isHeader;
        private final int wordIndex;
        private final int meaningIndex;
        private final int phoneticIndex;

        private HeaderIndexes(boolean isHeader, int wordIndex, int meaningIndex, int phoneticIndex) {
            this.isHeader = isHeader;
            this.wordIndex = wordIndex;
            this.meaningIndex = meaningIndex;
            this.phoneticIndex = phoneticIndex;
        }
    }

    public void updateFamiliar(Long wordId, boolean familiar) {
        trainingRepository.setFamiliar(wordId, familiar);
    }
}
