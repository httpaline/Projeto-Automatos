const AFD = require('./afd');

function AFNtoAFD(afn) {
    //gera combinações de estados
    const gerarCombinacoes = (arr) => {
        let resultado = [];
        for (let i = 1; i <= arr.length; i++) {
            resultado = resultado.concat(combinacoes(arr, i));
        }
        return resultado;
    };

    const combinacoes = (arr, k) => {
        if (k > arr.length || k <= 0) return [];
        if (k === arr.length) return [arr];
        if (k === 1) return arr.map(el => [el]);

        let combs = [], tailCombs = [];
        for (let i = 0; i <= arr.length - k; i++) {
            tailCombs = combinacoes(arr.slice(i + 1), k - 1);
            tailCombs.forEach(tailComb => combs.push([arr[i], ...tailComb]));
        }
        return combs;
    };

    const gerarNomeEstado = (estados) => estados.sort().join(',');

    const combinacoesLista = gerarCombinacoes(afn.estados);
    
    //mapeamento para combinações de estados
    const nomeEstadoMap = {};
    combinacoesLista.forEach((combinacao, index) => {
        const nome = `s${index}`;
        nomeEstadoMap[gerarNomeEstado(combinacao)] = nome;
    });

    //tabela de transição do AFD
    const delta = afn.transicoes;
    const alfabeto = afn.alfabeto;
    const finais = afn.estadosFinais;
    const tabelaDeTransicaoAFD = {};

    //construir a tabela de transição
    combinacoesLista.forEach(combinacao => {
        const combinacaoStr = gerarNomeEstado(combinacao);
        const nomeCombinacao = nomeEstadoMap[combinacaoStr];

        alfabeto.forEach(simbolo => {
            const listaAux2 = new Set();

            combinacao.forEach(elemento => {
                const transicoesElemento = delta[elemento] && delta[elemento][simbolo] ? delta[elemento][simbolo] : [];
                transicoesElemento.forEach(e => e && listaAux2.add(e));
            });

            const listaAux2Str = Array.from(listaAux2).sort().join(',');
            const nomeDestino = nomeEstadoMap[listaAux2Str] || '';

            tabelaDeTransicaoAFD[`${nomeCombinacao},${simbolo}`] = nomeDestino;
        });
    });

    //identifica estados finais
    const estadosFinais = combinacoesLista
        .map(combinacao => gerarNomeEstado(combinacao))
        .filter(combinacaoStr => combinacaoStr.split(',').some(e => finais.includes(e)))
        .map(combinacaoStr => nomeEstadoMap[combinacaoStr]);

    //gera tabela de transição reduzida
    let estadosReduzidos = [nomeEstadoMap[afn.estadoInicial]];

    Object.keys(tabelaDeTransicaoAFD).forEach(key => {
        const [estado, simbolo] = key.split(',');
        const estadoDestino = tabelaDeTransicaoAFD[key];

        if (estadoDestino && !estadosReduzidos.includes(estadoDestino)) {
            estadosReduzidos.push(estadoDestino);
        }
    });

    let alcancaveis = [];
    estadosReduzidos.forEach(estado => {
        if (estado === nomeEstadoMap[afn.estadoInicial]) {
            alcancaveis.push(estado);
            return;
        }

        estadosReduzidos.forEach(estadoRed => {
            alfabeto.forEach(simbolo => {
                if (tabelaDeTransicaoAFD[`${estadoRed},${simbolo}`] === estado) {
                    if (!alcancaveis.includes(estado)) {
                        alcancaveis.push(estado);
                    }
                }
            });
        });
    });

    estadosReduzidos = alcancaveis;

    //remove estados que retornam a ele mesmo
    estadosReduzidos = estadosReduzidos.filter(estado => {
        return new Set(alfabeto.map(simbolo => tabelaDeTransicaoAFD[`${estado},${simbolo}`])).size > 1;
    });

    const finaisReduzidos = estadosReduzidos.filter(estado => estadosFinais.includes(estado));

    const Reduzida_AFD = {};
    estadosReduzidos.forEach(estado => {
        alfabeto.forEach(simbolo => {
            Reduzida_AFD[`${estado},${simbolo}`] = tabelaDeTransicaoAFD[`${estado},${simbolo}`] || '';
        });
    });

    const afd = new AFD(estadosReduzidos, alfabeto, Reduzida_AFD, nomeEstadoMap[afn.estadoInicial], finaisReduzidos);
    return afd;
}

module.exports = AFNtoAFD;
