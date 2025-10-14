# Fontes do Projeto Semaninha

## Como Adicionar a Fonte Bryndan Write

### **1. Baixar a Fonte**
- Baixe a fonte "Bryndan Write" em formato TTF, WOFF ou WOFF2
- Você pode encontrá-la em sites como:
  - [DaFont](https://www.dafont.com/)
  - [Google Fonts](https://fonts.google.com/)
  - [Font Squirrel](https://www.fontsquirrel.com/)

### **2. Colocar no Projeto**
Coloque os arquivos da fonte na pasta `public/fonts/`:

```
public/
└── fonts/
    ├── BryndanWrite.ttf
    ├── BryndanWrite.woff
    ├── BryndanWrite.woff2
    ├── BryndanWrite-Bold.ttf
    ├── BryndanWrite-Bold.woff
    └── BryndanWrite-Bold.woff2
```

### **3. Formatos Suportados**
- **TTF**: Formato mais compatível
- **WOFF**: Formato otimizado para web
- **WOFF2**: Formato mais moderno e eficiente

### **4. Verificar Funcionamento**
Após adicionar as fontes:
1. Execute `npm run dev`
2. Gere uma nova colagem
3. A marca d'água deve aparecer com a fonte Bryndan Write

### **5. Fallback Automático**
Se a fonte não estiver disponível, o navegador usará automaticamente a fonte padrão do sistema.

## **Estrutura de Arquivos Atual**
```
semaninha/
├── public/
│   └── fonts/          ← Coloque as fontes aqui
├── src/
│   ├── index.css       ← Declarações @font-face
│   └── services/
│       └── collageGenerator.ts  ← Uso da fonte
└── FONTES.md           ← Este arquivo
```

## **Notas Importantes**
- As fontes devem ser arquivos legítimos e com licença adequada
- O formato WOFF2 oferece melhor performance
- Use `font-display: swap` para melhor experiência do usuário
