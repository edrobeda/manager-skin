// let conteudoArquivo = ''; // variável global ou fora da função
// async function readFile(nomeArquivo = 'pagtos.txt') {
//   try {
//     const response = await fetch(`/${nomeArquivo}`);
//     const texto = await response.text();
//     conteudoArquivo = texto; // salva o conteúdo para uso posterior
//   } catch (err) {
//     console.error('Erro ao ler o arquivo:', err);
//   }
// }
// readFile(); // chama a função

// function extractData(text) {
//     return text.split('\n')
//         .map(line => {
//         let text = line.split('\t')
        
//         let [data, nome, credito, valor] = text
//         if(data === '') return null
        
//         // Extract city and BR from nome if present
//         let nomeParts = nome.trim().split(/\s+/)
//         let cidade = ''
//         let br = ''
        
//         // Check if last parts contain city and BR
//         if (nomeParts.length >= 2 && nomeParts[nomeParts.length-1] === 'BR') {
//             br = nomeParts.pop() // Remove BR
//             cidade = nomeParts.pop() // Remove city
//         }
    
//         // Extract parcela info from remaining nome
//         let parcelasMatch = nome.match(/(\d{2})\/(\d{2})/)
//         if (parcelasMatch) {
//             parcelas = {
//                 atual: parseInt(parcelasMatch[1]),
//                 total: parseInt(parcelasMatch[2])
//             }
//             // Remove parcela info from nome
//             nome = nome.replace(/\s+\d{2}\/\d{2}\s*/, ' ')
//         }
    
//         // Clean up remaining nome
//         nome = nome.trim()
        
//         // Clean up valor
//         valor = valor ? parseFloat(valor.trim()) : 0
//         credito = credito ? parseFloat(credito.trim()) : 0
//         return {data, nome, parcelas, credito, valor}
//     })
// }

