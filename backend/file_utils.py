"""
Утилиты для работы с файлами резюме (PDF, DOCX, TXT)
"""
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: Path) -> Optional[str]:
    """Извлекает текст из PDF файла используя PyMuPDF (fitz) - самый надежный"""
    try:
        import fitz  # PyMuPDF
        
        text = ""
        doc = fitz.open(str(file_path))
        
        for page_num in range(len(doc)):
            try:
                page = doc[page_num]
                page_text = page.get_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as page_error:
                logger.warning(f"Ошибка при чтении страницы {page_num}: {page_error}")
                continue
        
        doc.close()
        
        if not text.strip():
            logger.warning(f"PDF не содержит извлекаемого текста: {file_path}")
            return None
            
        return text.strip()
    
    except Exception as e:
        logger.error(f"Ошибка при чтении PDF с PyMuPDF {file_path}: {e}")
        # Fallback на pdfplumber
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(str(file_path)) as pdf:
                for page in pdf.pages:
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    except:
                        continue
            return text.strip() if text.strip() else None
        except Exception as e2:
            # Последний fallback на PyPDF2
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(str(file_path), strict=False)
                text = ""
                for page in reader.pages:
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    except:
                        continue
                return text.strip() if text.strip() else None
            except Exception as e3:
                logger.error(f"Все методы извлечения текста из PDF не сработали: {e3}")
                return None


def extract_text_from_docx(file_path: Path) -> Optional[str]:
    """Извлекает текст из DOCX файла"""
    try:
        from docx import Document
        
        doc = Document(str(file_path))
        text = ""
        
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    
    except Exception as e:
        logger.error(f"Ошибка при чтении DOCX: {e}")
        return None


def extract_text_from_txt(file_path: Path) -> Optional[str]:
    """Извлекает текст из TXT файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except UnicodeDecodeError:
        # Пробуем другую кодировку
        try:
            with open(file_path, 'r', encoding='cp1251') as f:
                return f.read().strip()
        except Exception as e:
            logger.error(f"Ошибка при чтении TXT: {e}")
            return None
    except Exception as e:
        logger.error(f"Ошибка при чтении TXT: {e}")
        return None


def extract_text_from_file(file_path: Path) -> Optional[str]:
    """
    Извлекает текст из файла в зависимости от его типа
    
    Args:
        file_path: Путь к файлу
        
    Returns:
        Извлеченный текст или None в случае ошибки
    """
    suffix = file_path.suffix.lower()
    
    if suffix == '.pdf':
        return extract_text_from_pdf(file_path)
    elif suffix in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    elif suffix == '.txt':
        return extract_text_from_txt(file_path)
    else:
        logger.warning(f"Неподдерживаемый формат файла: {suffix}")
        return None

