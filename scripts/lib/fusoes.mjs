/**
 * Municípios criados depois de uma eleição (ADR 0015): no mapa daquele ano, a área volta para o município de origem.
 * `ateAno`: último ano de eleição em que o município novo ainda não existia (o eleitor votava na origem).
 */
export const FUSOES = [
  // Boa Esperança do Norte (MT): desmembrado de Nova Ubiratã, instalado em 2025
  { uf: 'mt', novo: '5101837', origem: '5106240', ateAno: 2025 },
  // Nazária (PI): criado em 1995, instalado em 2009 (primeira eleição municipal em 2008); em 2006 votava em Teresina
  { uf: 'pi', novo: '2206720', origem: '2211001', ateAno: 2007 },
  // instalados em 2001 (primeira eleição municipal em 2000): em 1998 ainda votavam na origem. Origem pela genealogia
  // do IBGE/SPGG-RS; com mais de uma origem, a que tinha a zona eleitoral do município novo (scripts/propor-fusoes.mjs)
  { uf: 'al', novo: '2703759', origem: '2708600', ateAno: 2000 }, // Jequiá da praia ← São Miguel dos Campos
  { uf: 'ba', novo: '2919553', origem: '2903201', ateAno: 2000 }, // Luís eduardo magalhães ← Barreiras
  { uf: 'ba', novo: '2903276', origem: '2930501', ateAno: 2000 }, // Barrocas ← Serrinha
  { uf: 'es', novo: '3202256', origem: '3201506', ateAno: 2000 }, // Governador lindenberg ← Colatina
  { uf: 'go', novo: '5210158', origem: '5205406', ateAno: 2000 }, // Ipiranga de goiás ← Ceres
  { uf: 'go', novo: '5208152', origem: '5220603', ateAno: 2000 }, // Gameleira de goiás ← Silvânia
  { uf: 'go', novo: '5204854', origem: '5201108', ateAno: 2000 }, // Campo limpo de goiás ← Anápolis
  { uf: 'go', novo: '5212253', origem: '5210802', ateAno: 2000 }, // Lagoa santa ← Itajá
  { uf: 'mt', novo: '5103361', origem: '5106752', ateAno: 2000 }, // Conquista d'oeste ← Pontes e Lacerda
  { uf: 'mt', novo: '5103254', origem: '5101407', ateAno: 2000 }, // Colniza ← Aripuanã
  { uf: 'mt', novo: '5101852', origem: '5100359', ateAno: 2000 }, // Bom jesus do araguaia ← Alto Boa Vista
  { uf: 'mt', novo: '5108352', origem: '5106752', ateAno: 2000 }, // Vale de são domingos ← Pontes e Lacerda
  { uf: 'mt', novo: '5107883', origem: '5107859', ateAno: 2000 }, // Serra nova dourada ← São Félix do Araguaia
  { uf: 'mt', novo: '5107768', origem: '5106224', ateAno: 2000 }, // Santa rita do trivelato ← Nova Mutum
  { uf: 'mt', novo: '5106315', origem: '5107859', ateAno: 2000 }, // Novo santo antônio ← São Félix do Araguaia
  { uf: 'mt', novo: '5106174', origem: '5100201', ateAno: 2000 }, // Nova nazaré ← Água Boa
  { uf: 'rj', novo: '3302858', origem: '3303500', ateAno: 2000 }, // Mesquita ← Nova Iguaçu
  { uf: 'rs', novo: '4315313', origem: '4310900', ateAno: 2000 }, // Quatro irmãos ← Jacutinga
  { uf: 'rs', novo: '4323770', origem: '4321451', ateAno: 2000 }, // Westfalia ← Teutônia
  { uf: 'rs', novo: '4306130', origem: '4303806', ateAno: 2000 }, // Cruzaltense ← Campinas do Sul
  { uf: 'rs', novo: '4314464', origem: '4307401', ateAno: 2000 }, // Pinhal da serra ← Esmeralda
  { uf: 'rs', novo: '4314175', origem: '4314506', ateAno: 2000 }, // Pedras altas ← Pinheiro Machado
  { uf: 'rs', novo: '4314134', origem: '4310900', ateAno: 2000 }, // Paulo bento ← Jacutinga
  { uf: 'rs', novo: '4305934', origem: '4308607', ateAno: 2000 }, // Coronel pilar ← Garibaldi
  { uf: 'rs', novo: '4305835', origem: '4313003', ateAno: 2000 }, // Coqueiro baixo ← Nova Bréscia
  { uf: 'rs', novo: '4321469', origem: '4323200', ateAno: 2000 }, // Tio hugo ← Victor Graeff
  { uf: 'rs', novo: '4313466', origem: '4305801', ateAno: 2000 }, // Novo xingu ← Constantina
  { uf: 'rs', novo: '4304622', origem: '4311304', ateAno: 2000 }, // Capão bonito do sul ← Lagoa Vermelha
  { uf: 'rs', novo: '4304614', origem: '4315156', ateAno: 2000 }, // Canudos do vale ← Progresso
  { uf: 'rs', novo: '4304655', origem: '4317400', ateAno: 2000 }, // Capão do cipó ← Santiago
  { uf: 'rs', novo: '4312179', origem: '4303301', ateAno: 2000 }, // Mato queimado ← Caibaté
  { uf: 'rs', novo: '4311239', origem: '4320701', ateAno: 2000 }, // Lagoa bonita do sul ← Sobradinho
  { uf: 'rs', novo: '4319364', origem: '4313706', ateAno: 2000 }, // São pedro das missões ← Palmeira das Missões
  { uf: 'rs', novo: '4302584', origem: '4310207', ateAno: 2000 }, // Bozano ← Ijuí
  { uf: 'rs', novo: '4310652', origem: '4321436', ateAno: 2000 }, // Itati ← Terra de Areia
  { uf: 'rs', novo: '4310876', origem: '4316451', ateAno: 2000 }, // Jacuizinho ← Salto do Jacuí
  { uf: 'rs', novo: '4318614', origem: '4316501', ateAno: 2000 }, // São josé do sul ← Salvador do Sul
  { uf: 'rs', novo: '4301073', origem: '4314407', ateAno: 2000 }, // Arroio do padre ← Pelotas
  { uf: 'rs', novo: '4316972', origem: '4318309', ateAno: 2000 }, // Santa margarida do sul ← São Gabriel
  { uf: 'rs', novo: '4300471', origem: '4304705', ateAno: 2000 }, // Almirante tamandaré do sul ← Carazinho
  { uf: 'rs', novo: '4300034', origem: '4301602', ateAno: 2000 }, // Aceguá ← Bagé
  { uf: 'rs', novo: '4308433', origem: '4311403', ateAno: 2000 }, // Forquetinha ← Lajeado
  { uf: 'rs', novo: '4316733', origem: '4300059', ateAno: 2000 }, // Santa cecília do sul ← Água Santa
  // instalados em 2005 (primeira eleição municipal em 2004): em 2002 ainda votavam na origem
  { uf: 'pi', novo: '2200954', origem: '2208007', ateAno: 2003 }, // Aroeiras do Itaim ← Picos
  { uf: 'ms', novo: '5003900', origem: '5002605', ateAno: 2003 }, // Figueirão ← Camapuã
  { uf: 'mt', novo: '5104526', origem: '5108006', ateAno: 2003 }, // Ipiranga do Norte ← Tapurah
  { uf: 'mt', novo: '5104542', origem: '5108006', ateAno: 2003 }, // Itanhangá ← Tapurah
  // instalados em 1997 (primeira eleição municipal em 1996): em 1994 ainda votavam na origem. Origem pelo grupo de
  // Áreas Mínimas Comparáveis 1991–2000 (IBGE/Ipea); com mais de uma origem no grupo, a da zona eleitoral de 1998 ou a
  // de maior fronteira (scripts/propor-fusoes.mjs --amc). Origem que também é nova segue a cadeia (fusoesDoAno).
  { uf: 'al', novo: '2701357', origem: '2703908', ateAno: 1996 }, // Campestre ← Jundiá
  { uf: 'ap', novo: '1600808', origem: '1600279', ateAno: 1996 }, // Vitória do Jari ← Laranjal do Jari
  { uf: 'es', novo: '3201159', origem: '3200102', ateAno: 1996 }, // Brejetuba ← Afonso Cláudio
  { uf: 'es', novo: '3203320', origem: '3202801', ateAno: 1996 }, // Marataízes ← Itapemirim
  { uf: 'es', novo: '3204252', origem: '3203601', ateAno: 1996 }, // Ponto Belo ← Mucurici
  { uf: 'es', novo: '3205010', origem: '3203205', ateAno: 1996 }, // Sooretama ← Linhares
  { uf: 'es', novo: '3204955', origem: '3204609', ateAno: 1996 }, // São Roque do Canaã ← Santa Teresa
  { uf: 'es', novo: '3205176', origem: '3204708', ateAno: 1996 }, // Vila Valério ← São Gabriel da Palha
  { uf: 'go', novo: '5200050', origem: '5209200', ateAno: 1996 }, // Abadia de Goiás ← Guapó
  { uf: 'go', novo: '5200829', origem: '5212808', ateAno: 1996 }, // Amaralina ← Mara Rosa
  { uf: 'go', novo: '5203575', origem: '5218003', ateAno: 1996 }, // Bonópolis ← Porangatu
  { uf: 'go', novo: '5215231', origem: '5212501', ateAno: 1996 }, // Novo Gama ← Luziânia
  { uf: 'go', novo: '5218052', origem: '5209101', ateAno: 1996 }, // Porteirão ← Goiatuba
  { uf: 'go', novo: '5219456', origem: '5203203', ateAno: 1996 }, // Santa Rita do Novo Destino ← Barro Alto
  { uf: 'go', novo: '5220280', origem: '5205000', ateAno: 1996 }, // São Patrício ← Carmo do Rio Verde
  { uf: 'go', novo: '5221858', origem: '5212501', ateAno: 1996 }, // Valparaíso de Goiás ← Luziânia
  { uf: 'go', novo: '5222302', origem: '5217302', ateAno: 1996 }, // Vila Propício ← Pirenópolis
  { uf: 'go', novo: '5200258', origem: '5219753', ateAno: 1996 }, // Águas Lindas de Goiás ← Santo Antônio do Descoberto
  { uf: 'ma', novo: '2100436', origem: '2101202', ateAno: 1996 }, // Alto Alegre do Maranhão ← Bacabal
  { uf: 'ma', novo: '2100477', origem: '2110005', ateAno: 1996 }, // Alto Alegre do Pindaré ← Santa Luzia
  { uf: 'ma', novo: '2100550', origem: '2104305', ateAno: 1996 }, // Amapá do Maranhão ← Godofredo Viana
  { uf: 'ma', novo: '2100832', origem: '2101301', ateAno: 1996 }, // Apicum-açu ← Bacuri
  { uf: 'ma', novo: '2100873', origem: '2114007', ateAno: 1996 }, // Araguanã ← Zé Doca
  { uf: 'ma', novo: '2101251', origem: '2109601', ateAno: 1996 }, // Bacabeira ← Rosário
  { uf: 'ma', novo: '2101350', origem: '2102408', ateAno: 1996 }, // Bacurituba ← Cajapió
  { uf: 'ma', novo: '2101772', origem: '2112902', ateAno: 1996 }, // Bela Vista do Maranhão ← Vitória do Mearim
  { uf: 'ma', novo: '2101731', origem: '2112605', ateAno: 1996 }, // Belágua ← Urbano Santos
  { uf: 'ma', novo: '2101939', origem: '2105203', ateAno: 1996 }, // Bernardo do Mearim ← Igarapé Grande
  { uf: 'ma', novo: '2101970', origem: '2102903', ateAno: 1996 }, // Boa Vista do Gurupi ← Carutapera
  { uf: 'ma', novo: '2102036', origem: '2110005', ateAno: 1996 }, // Bom Jesus das Selvas ← Santa Luzia
  { uf: 'ma', novo: '2102077', origem: '2101202', ateAno: 1996 }, // Bom Lugar ← Bacabal
  { uf: 'ma', novo: '2102150', origem: '2110005', ateAno: 1996 }, // Brejo de Areia ← Santa Luzia
  { uf: 'ma', novo: '2102325', origem: '2110005', ateAno: 1996 }, // Buriticupu ← Santa Luzia
  { uf: 'ma', novo: '2102358', origem: '2105500', ateAno: 1996 }, // Buritirana ← João Lisboa
  { uf: 'ma', novo: '2102374', origem: '2107100', ateAno: 1996 }, // Cachoeira Grande ← Morros
  { uf: 'ma', novo: '2102556', origem: '2109007', ateAno: 1996 }, // Campestre do Maranhão ← Porto Franco
  { uf: 'ma', novo: '2102754', origem: '2103307', ateAno: 1996 }, // Capinzal do Norte ← Codó
  { uf: 'ma', novo: '2103125', origem: '2106805', ateAno: 1996 }, // Central do Maranhão ← Mirinzal
  { uf: 'ma', novo: '2103158', origem: '2104305', ateAno: 1996 }, // Centro do Guilherme ← Godofredo Viana
  { uf: 'ma', novo: '2103174', origem: '2102903', ateAno: 1996 }, // Centro Novo do Maranhão ← Carutapera
  { uf: 'ma', novo: '2103257', origem: '2105302', ateAno: 1996 }, // Cidelândia ← Imperatriz
  { uf: 'ma', novo: '2103554', origem: '2112902', ateAno: 1996 }, // Conceição do Lago-açu ← Vitória do Mearim
  { uf: 'ma', novo: '2103752', origem: '2105302', ateAno: 1996 }, // Davinópolis ← Imperatriz
  { uf: 'ma', novo: '2104073', origem: '2109502', ateAno: 1996 }, // Feira Nova do Maranhão ← Riachão
  { uf: 'ma', novo: '2104081', origem: '2101608', ateAno: 1996 }, // Fernando Falcão ← Barra do Corda
  { uf: 'ma', novo: '2104099', origem: '2104800', ateAno: 1996 }, // Formosa da Serra Negra ← Grajaú
  { uf: 'ma', novo: '2104552', origem: '2105302', ateAno: 1996 }, // Governador Edison Lobão ← Imperatriz
  { uf: 'ma', novo: '2104628', origem: '2110708', ateAno: 1996 }, // Governador Luiz Rocha ← São Domingos do Maranhão
  { uf: 'ma', novo: '2104651', origem: '2114007', ateAno: 1996 }, // Governador Newton Bello ← Zé Doca
  { uf: 'ma', novo: '2104677', origem: '2102606', ateAno: 1996 }, // Governador Nunes Freire ← Cândido Mendes
  { uf: 'ma', novo: '2105153', origem: '2112902', ateAno: 1996 }, // Igarapé do Meio ← Vitória do Mearim
  { uf: 'ma', novo: '2105351', origem: '2104800', ateAno: 1996 }, // Itaipava do Grajaú ← Grajaú
  { uf: 'ma', novo: '2105427', origem: '2100055', ateAno: 1996 }, // Itinga do Maranhão ← Açailândia
  { uf: 'ma', novo: '2105450', origem: '2103505', ateAno: 1996 }, // Jatobá ← Colinas
  { uf: 'ma', novo: '2105476', origem: '2101608', ateAno: 1996 }, // Jenipapo dos Vieiras ← Barra do Corda
  { uf: 'ma', novo: '2105658', origem: '2102903', ateAno: 1996 }, // Junco do Maranhão ← Carutapera
  { uf: 'ma', novo: '2105948', origem: '2105203', ateAno: 1996 }, // Lago dos Rodrigues ← Igarapé Grande
  { uf: 'ma', novo: '2105922', origem: '2107902', ateAno: 1996 }, // Lagoa do Mato ← Passagem Franca
  { uf: 'ma', novo: '2105963', origem: '2105708', ateAno: 1996 }, // Lagoa Grande do Maranhão ← Lago da Pedra
  { uf: 'ma', novo: '2105989', origem: '2107001', ateAno: 1996 }, // Lajeado Novo ← Montes Altos
  { uf: 'ma', novo: '2106326', origem: '2104305', ateAno: 1996 }, // Maracaçumé ← Godofredo Viana
  { uf: 'ma', novo: '2106359', origem: '2108108', ateAno: 1996 }, // Marajá do Sena ← Paulo Ramos
  { uf: 'ma', novo: '2106375', origem: '2102606', ateAno: 1996 }, // Maranhãozinho ← Cândido Mendes
  { uf: 'ma', novo: '2106631', origem: '2111508', ateAno: 1996 }, // Matões do Norte ← São Mateus do Maranhão
  { uf: 'ma', novo: '2106672', origem: '2110104', ateAno: 1996 }, // Milagres do Maranhão ← Santa Quitéria do Maranhão
  { uf: 'ma', novo: '2107258', origem: '2104107', ateAno: 1996 }, // Nova Colinas ← Fortaleza dos Nogueiras
  { uf: 'ma', novo: '2107357', origem: '2110039', ateAno: 1996 }, // Nova Olinda do Maranhão ← Santa Luzia do Paruá
  { uf: 'ma', novo: '2107456', origem: '2106508', ateAno: 1996 }, // Olinda Nova do Maranhão ← Matinha
  { uf: 'ma', novo: '2108058', origem: '2112506', ateAno: 1996 }, // Paulino Neves ← Tutóia
  { uf: 'ma', novo: '2108256', origem: '2108603', ateAno: 1996 }, // Pedro do Rosário ← Pinheiro
  { uf: 'ma', novo: '2108454', origem: '2103604', ateAno: 1996 }, // Peritoró ← Coroatá
  { uf: 'ma', novo: '2109056', origem: '2103109', ateAno: 1996 }, // Porto Rico do Maranhão ← Cedral
  { uf: 'ma', novo: '2109239', origem: '2110039', ateAno: 1996 }, // Presidente Médici ← Santa Luzia do Paruá
  { uf: 'ma', novo: '2109270', origem: '2108603', ateAno: 1996 }, // Presidente Sarney ← Pinheiro
  { uf: 'ma', novo: '2109452', origem: '2107506', ateAno: 1996 }, // Raposa ← Paço do Lumiar
  { uf: 'ma', novo: '2109551', origem: '2107001', ateAno: 1996 }, // Ribamar Fiquene ← Montes Altos
  { uf: 'ma', novo: '2109759', origem: '2112308', ateAno: 1996 }, // Santa Filomena do Maranhão ← Tuntum
  { uf: 'ma', novo: '2110237', origem: '2110609', ateAno: 1996 }, // Santana do Maranhão ← São Bernardo
  { uf: 'ma', novo: '2110278', origem: '2109403', ateAno: 1996 }, // Santo Amaro do Maranhão ← Primeira Cruz
  { uf: 'ma', novo: '2111722', origem: '2107407', ateAno: 1996 }, // Satubinha ← Olho d'Água das Cunhãs
  { uf: 'ma', novo: '2111748', origem: '2104602', ateAno: 1996 }, // Senador Alexandre Costa ← Governador Eugênio Barros
  { uf: 'ma', novo: '2111763', origem: '2105500', ateAno: 1996 }, // Senador La Rocque ← João Lisboa
  { uf: 'ma', novo: '2111789', origem: '2103703', ateAno: 1996 }, // Serrano do Maranhão ← Cururupu
  { uf: 'ma', novo: '2111953', origem: '2111102', ateAno: 1996 }, // Sucupira do Riachão ← São João dos Patos
  { uf: 'ma', novo: '2110658', origem: '2101806', ateAno: 1996 }, // São Domingos do Azeitão ← Benedito Leite
  { uf: 'ma', novo: '2110856', origem: '2105302', ateAno: 1996 }, // São Francisco do Brejão ← Imperatriz
  { uf: 'ma', novo: '2111250', origem: '2109106', ateAno: 1996 }, // São José dos Basílios ← Presidente Dutra
  { uf: 'ma', novo: '2111029', origem: '2102002', ateAno: 1996 }, // São João do Carú ← Bom Jardim
  { uf: 'ma', novo: '2111052', origem: '2109007', ateAno: 1996 }, // São João do Paraíso ← Porto Franco
  { uf: 'ma', novo: '2111078', origem: '2103000', ateAno: 1996 }, // São João do Soter ← Caxias
  { uf: 'ma', novo: '2111532', origem: '2105302', ateAno: 1996 }, // São Pedro da Água Branca ← Imperatriz
  { uf: 'ma', novo: '2111573', origem: '2104057', ateAno: 1996 }, // São Pedro dos Crentes ← Estreito
  { uf: 'ma', novo: '2111631', origem: '2104008', ateAno: 1996 }, // São Raimundo do Doca Bezerra ← Esperantinópolis
  { uf: 'ma', novo: '2111672', origem: '2104008', ateAno: 1996 }, // São Roberto ← Esperantinópolis
  { uf: 'ma', novo: '2112233', origem: '2108207', ateAno: 1996 }, // Trizidela do Vale ← Pedreiras
  { uf: 'ma', novo: '2112274', origem: '2108504', ateAno: 1996 }, // Tufilândia ← Pindaré-mirim
  { uf: 'ma', novo: '2112456', origem: '2112407', ateAno: 1996 }, // Turilândia ← Turiaçu
  { uf: 'ma', novo: '2112852', origem: '2105302', ateAno: 1996 }, // Vila Nova dos Martírios ← Imperatriz
  { uf: 'ma', novo: '2100154', origem: '2100907', ateAno: 1996 }, // Água Doce do Maranhão ← Araioses
  { uf: 'mg', novo: '3102050', origem: '3112109', ateAno: 1996 }, // Alto Caparaó ← Caparaó
  { uf: 'mg', novo: '3102852', origem: '3112307', ateAno: 1996 }, // Angelândia ← Capelinha
  { uf: 'mg', novo: '3104452', origem: '3132503', ateAno: 1996 }, // Aricanduva ← Itamarandiba
  { uf: 'mg', novo: '3106655', origem: '3168002', ateAno: 1996 }, // Berizal ← Taiobeiras
  { uf: 'mg', novo: '3108255', origem: '3135209', ateAno: 1996 }, // Bonito de Minas ← Januária
  { uf: 'mg', novo: '3108552', origem: '3136306', ateAno: 1996 }, // Brasilândia de Minas ← João Pinheiro
  { uf: 'mg', novo: '3109253', origem: '3129301', ateAno: 1996 }, // Bugre ← Iapu
  { uf: 'mg', novo: '3109451', origem: '3170404', ateAno: 1996 }, // Cabeceira Grande ← Unaí
  { uf: 'mg', novo: '3111150', origem: '3108602', ateAno: 1996 }, // Campo Azul ← Brasília de Minas
  { uf: 'mg', novo: '3112059', origem: '3148608', ateAno: 1996 }, // Cantagalo ← Peçanha
  { uf: 'mg', novo: '3115359', origem: '3157203', ateAno: 1996 }, // Catas Altas ← Santa Bárbara
  { uf: 'mg', novo: '3115474', origem: '3141009', ateAno: 1996 }, // Catuti ← Mato Verde
  { uf: 'mg', novo: '3116159', origem: '3170529', ateAno: 1996 }, // Chapada Gaúcha ← Urucuia
  { uf: 'mg', novo: '3117876', origem: '3137601', ateAno: 1996 }, // Confins ← Lagoa Santa
  { uf: 'mg', novo: '3120151', origem: '3100906', ateAno: 1996 }, // Crisólita ← Águas Formosas
  { uf: 'mg', novo: '3120839', origem: '3118403', ateAno: 1996 }, // Cuparaque ← Conselheiro Pena
  { uf: 'mg', novo: '3120870', origem: '3101003', ateAno: 1996 }, // Curral de Dentro ← Águas Vermelhas
  { uf: 'mg', novo: '3119955', origem: '3126109', ateAno: 1996 }, // Córrego Fundo ← Formiga
  { uf: 'mg', novo: '3117836', origem: '3135209', ateAno: 1996 }, // Cônego Marinho ← Januária
  { uf: 'mg', novo: '3121258', origem: '3170107', ateAno: 1996 }, // Delta ← Uberaba
  { uf: 'mg', novo: '3122355', origem: '3101003', ateAno: 1996 }, // Divisa Alegre ← Águas Vermelhas
  { uf: 'mg', novo: '3122470', origem: '3108206', ateAno: 1996 }, // Dom Bosco ← Bonfinópolis de Minas
  { uf: 'mg', novo: '3126752', origem: '3139201', ateAno: 1996 }, // Franciscópolis ← Malacacheta
  { uf: 'mg', novo: '3126950', origem: '3163508', ateAno: 1996 }, // Frei Lagonegro ← São José do Jacuri
  { uf: 'mg', novo: '3127073', origem: '3157005', ateAno: 1996 }, // Fruta de Leite ← Salinas
  { uf: 'mg', novo: '3127339', origem: '3142908', ateAno: 1996 }, // Gameleiras ← Monte Azul
  { uf: 'mg', novo: '3127354', origem: '3136801', ateAno: 1996 }, // Glaucilândia ← Juramento
  { uf: 'mg', novo: '3127370', origem: '3118403', ateAno: 1996 }, // Goiabeira ← Conselheiro Pena
  { uf: 'mg', novo: '3127388', origem: '3155405', ateAno: 1996 }, // Goianá ← Rio Novo
  { uf: 'mg', novo: '3128253', origem: '3107307', ateAno: 1996 }, // Guaraciama ← Bocaiúva
  { uf: 'mg', novo: '3129657', origem: '3170909', ateAno: 1996 }, // Ibiracatu ← Varzelândia
  { uf: 'mg', novo: '3130556', origem: '3170057', ateAno: 1996 }, // Imbé de Minas ← Ubaporanga
  { uf: 'mg', novo: '3130655', origem: '3155603', ateAno: 1996 }, // Indaiabira ← Rio Pardo de Minas
  { uf: 'mg', novo: '3135357', origem: '3108602', ateAno: 1996 }, // Japonvar ← Brasília de Minas
  { uf: 'mg', novo: '3135456', origem: '3126505', ateAno: 1996 }, // Jenipapo de Minas ← Francisco Badaró
  { uf: 'mg', novo: '3136579', origem: '3127800', ateAno: 1996 }, // Josenópolis ← Grão Mogol
  { uf: 'mg', novo: '3136520', origem: '3106507', ateAno: 1996 }, // José Gonçalves de Minas ← Berilo
  { uf: 'mg', novo: '3136553', origem: '3158201', ateAno: 1996 }, // José Raydan ← Santa Maria do Suaçuí
  { uf: 'mg', novo: '3136959', origem: '3139300', ateAno: 1996 }, // Juvenília ← Manga
  { uf: 'mg', novo: '3138351', origem: '3141801', ateAno: 1996 }, // Leme do Prado ← Minas Novas
  { uf: 'mg', novo: '3138674', origem: '3162559', ateAno: 1996 }, // Luisburgo ← São João do Manhuaçu
  { uf: 'mg', novo: '3138682', origem: '3108602', ateAno: 1996 }, // Luislândia ← Brasília de Minas
  { uf: 'mg', novo: '3140530', origem: '3123528', ateAno: 1996 }, // Martins Soares ← Durandé
  { uf: 'mg', novo: '3142254', origem: '3139300', ateAno: 1996 }, // Miravânia ← Manga
  { uf: 'mg', novo: '3143153', origem: '3136009', ateAno: 1996 }, // Monte Formoso ← Joaíma
  { uf: 'mg', novo: '3140159', origem: '3129806', ateAno: 1996 }, // Mário Campos ← Ibirité
  { uf: 'mg', novo: '3144359', origem: '3100500', ateAno: 1996 }, // Naque ← Açucena
  { uf: 'mg', novo: '3144375', origem: '3108206', ateAno: 1996 }, // Natalândia ← Bonfinópolis de Minas
  { uf: 'mg', novo: '3144656', origem: '3162708', ateAno: 1996 }, // Ninheira ← São João do Paraíso
  { uf: 'mg', novo: '3144672', origem: '3139607', ateAno: 1996 }, // Nova Belém ← Mantena
  { uf: 'mg', novo: '3145059', origem: '3152204', ateAno: 1996 }, // Nova Porteirinha ← Porteirinha
  { uf: 'mg', novo: '3145356', origem: '3168606', ateAno: 1996 }, // Novo Oriente de Minas ← Teófilo Otoni
  { uf: 'mg', novo: '3145372', origem: '3157005', ateAno: 1996 }, // Novorizonte ← Salinas
  { uf: 'mg', novo: '3145455', origem: '3107307', ateAno: 1996 }, // Olhos d'Água ← Bocaiúva
  { uf: 'mg', novo: '3145851', origem: '3152105', ateAno: 1996 }, // Oratórios ← Ponte Nova
  { uf: 'mg', novo: '3145877', origem: '3122009', ateAno: 1996 }, // Orizânia ← Divino
  { uf: 'mg', novo: '3146255', origem: '3127800', ateAno: 1996 }, // Padre Carvalho ← Grão Mogol
  { uf: 'mg', novo: '3146552', origem: '3152204', ateAno: 1996 }, // Pai Pedro ← Porteirinha
  { uf: 'mg', novo: '3147956', origem: '3142007', ateAno: 1996 }, // Patis ← Mirabela
  { uf: 'mg', novo: '3148756', origem: '3100302', ateAno: 1996 }, // Pedra Bonita ← Abre Campo
  { uf: 'mg', novo: '3149952', origem: '3100500', ateAno: 1996 }, // Periquito ← Açucena
  { uf: 'mg', novo: '3150158', origem: '3113404', ateAno: 1996 }, // Piedade de Caratinga ← Caratinga
  { uf: 'mg', novo: '3150539', origem: '3120003', ateAno: 1996 }, // Pingo d'Água ← Córrego Novo
  { uf: 'mg', novo: '3150570', origem: '3161106', ateAno: 1996 }, // Pintópolis ← São Francisco
  { uf: 'mg', novo: '3152131', origem: '3170008', ateAno: 1996 }, // Ponto Chique ← Ubaí
  { uf: 'mg', novo: '3152170', origem: '3134004', ateAno: 1996 }, // Ponto dos Volantes ← Itinga
  { uf: 'mg', novo: '3154150', origem: '3139409', ateAno: 1996 }, // Reduto ← Manhuaçu
  { uf: 'mg', novo: '3156452', origem: '3143906', ateAno: 1996 }, // Rosário da Limeira ← Muriaé
  { uf: 'mg', novo: '3157278', origem: '3155900', ateAno: 1996 }, // Santa Bárbara do Monte Verde ← Rio Preto
  { uf: 'mg', novo: '3157336', origem: '3168804', ateAno: 1996 }, // Santa Cruz de Minas ← Tiradentes
  { uf: 'mg', novo: '3157377', origem: '3157005', ateAno: 1996 }, // Santa Cruz de Salinas ← Salinas
  { uf: 'mg', novo: '3157658', origem: '3106606', ateAno: 1996 }, // Santa Helena de Minas ← Bertópolis
  { uf: 'mg', novo: '3160454', origem: '3155603', ateAno: 1996 }, // Santo Antônio do Retiro ← Rio Pardo de Minas
  { uf: 'mg', novo: '3165537', origem: '3129806', ateAno: 1996 }, // Sarzedo ← Ibirité
  { uf: 'mg', novo: '3165560', origem: '3122702', ateAno: 1996 }, // Sem Peixe ← Dom Silvério
  { uf: 'mg', novo: '3166956', origem: '3152204', ateAno: 1996 }, // Serranópolis de Minas ← Porteirinha
  { uf: 'mg', novo: '3165552', origem: '3139201', ateAno: 1996 }, // Setubinha ← Malacacheta
  { uf: 'mg', novo: '3160959', origem: '3130903', ateAno: 1996 }, // São Domingos das Dores ← Inhapim
  { uf: 'mg', novo: '3161056', origem: '3141504', ateAno: 1996 }, // São Félix de Minas ← Mendes Pimentel
  { uf: 'mg', novo: '3161650', origem: '3127305', ateAno: 1996 }, // São Geraldo do Baixio ← Galiléia
  { uf: 'mg', novo: '3162922', origem: '3130101', ateAno: 1996 }, // São Joaquim de Bicas ← Igarapé
  { uf: 'mg', novo: '3162948', origem: '3101904', ateAno: 1996 }, // São José da Barra ← Alpinópolis
  { uf: 'mg', novo: '3162252', origem: '3118809', ateAno: 1996 }, // São João da Lagoa ← Coração de Jesus
  { uf: 'mg', novo: '3162450', origem: '3132107', ateAno: 1996 }, // São João das Missões ← Itacarambi
  { uf: 'mg', novo: '3162658', origem: '3118809', ateAno: 1996 }, // São João do Pacuí ← Coração de Jesus
  { uf: 'mg', novo: '3164431', origem: '3142205', ateAno: 1996 }, // São Sebastião da Vargem Alegre ← Miraí
  { uf: 'mg', novo: '3164472', origem: '3130903', ateAno: 1996 }, // São Sebastião do Anta ← Inhapim
  { uf: 'mg', novo: '3168051', origem: '3131208', ateAno: 1996 }, // Taparuba ← Ipanema
  { uf: 'mg', novo: '3169059', origem: '3108305', ateAno: 1996 }, // Tocos do Moji ← Borda da Mata
  { uf: 'mg', novo: '3170438', origem: '3138625', ateAno: 1996 }, // União de Minas ← Limeira do Oeste
  { uf: 'mg', novo: '3170479', origem: '3170404', ateAno: 1996 }, // Uruana de Minas ← Unaí
  { uf: 'mg', novo: '3170578', origem: '3113404', ateAno: 1996 }, // Vargem Alegre ← Caratinga
  { uf: 'mg', novo: '3170651', origem: '3143450', ateAno: 1996 }, // Vargem Grande do Rio Pardo ← Montezuma
  { uf: 'mg', novo: '3170750', origem: '3161700', ateAno: 1996 }, // Varjão de Minas ← São Gonçalo do Abaeté
  { uf: 'mg', novo: '3171030', origem: '3135100', ateAno: 1996 }, // Verdelândia ← Janaúba
  { uf: 'mg', novo: '3171071', origem: '3169703', ateAno: 1996 }, // Veredinha ← Turmalina
  { uf: 'mg', novo: '3171154', origem: '3154002', ateAno: 1996 }, // Vermelho Novo ← Raul Soares
  { uf: 'mt', novo: '5102686', origem: '5103304', ateAno: 1996 }, // Campos de Júlio ← Comodoro
  { uf: 'mt', novo: '5102793', origem: '5100250', ateAno: 1996 }, // Carlinda ← Alta Floresta
  { uf: 'mt', novo: '5103437', origem: '5105234', ateAno: 1996 }, // Curvelândia ← Lambari d'Oeste
  { uf: 'mt', novo: '5103700', origem: '5108501', ateAno: 1996 }, // Feliz Natal ← Vera
  { uf: 'mt', novo: '5103858', origem: '5106307', ateAno: 1996 }, // Gaúcha do Norte ← Paranatinga
  { uf: 'mt', novo: '5106182', origem: '5105507', ateAno: 1996 }, // Nova Lacerda ← Vila Bela da Santíssima Trindade
  { uf: 'mt', novo: '5106190', origem: '5105580', ateAno: 1996 }, // Nova Santa Helena ← Marcelândia
  { uf: 'mt', novo: '5106240', origem: '5107925', ateAno: 1996 }, // Nova Ubiratã ← Sorriso
  { uf: 'mt', novo: '5106265', origem: '5104104', ateAno: 1996 }, // Novo Mundo ← Guarantã do Norte
  { uf: 'mt', novo: '5107578', origem: '5101407', ateAno: 1996 }, // Rondolândia ← Aripuanã
  { uf: 'mt', novo: '5107743', origem: '5107354', ateAno: 1996 }, // Santa Cruz do Xingu ← São José do Xingu
  { uf: 'mt', novo: '5107792', origem: '5106281', ateAno: 1996 }, // Santo Antônio do Leste ← Novo São Joaquim
  { uf: 'mt', novo: '5107875', origem: '5102637', ateAno: 1996 }, // Sapezal ← Campo Novo do Parecis
  { uf: 'mt', novo: '5108303', origem: '5103056', ateAno: 1996 }, // União do Sul ← Cláudia
  { uf: 'pa', novo: '1500859', origem: '1505486', ateAno: 1996 }, // Anapu ← Pacajá
  { uf: 'pa', novo: '1501253', origem: '1502764', ateAno: 1996 }, // Bannach ← Cumaru do Norte
  { uf: 'pa', novo: '1501451', origem: '1506807', ateAno: 1996 }, // Belterra ← Santarém
  { uf: 'pa', novo: '1501956', origem: '1508308', ateAno: 1996 }, // Cachoeira do Piriá ← Viseu
  { uf: 'pa', novo: '1502152', origem: '1505536', ateAno: 1996 }, // Canaã dos Carajás ← Parauapebas
  { uf: 'pa', novo: '1502855', origem: '1500404', ateAno: 1996 }, // Curuá ← Alenquer
  { uf: 'pa', novo: '1504422', origem: '1501501', ateAno: 1996 }, // Marituba ← Benevides
  { uf: 'pa', novo: '1505437', origem: '1502764', ateAno: 1996 }, // Ourilândia do Norte ← Cumaru do Norte
  { uf: 'pa', novo: '1505635', origem: '1507458', ateAno: 1996 }, // Piçarra ← São Geraldo do Araguaia
  { uf: 'pa', novo: '1506112', origem: '1506104', ateAno: 1996 }, // Quatipuru ← Primavera
  { uf: 'pa', novo: '1507755', origem: '1508407', ateAno: 1996 }, // Sapucaia ← Xinguara
  { uf: 'pa', novo: '1507466', origem: '1507102', ateAno: 1996 }, // São João da Ponta ← São Caetano de Odivelas
  { uf: 'pa', novo: '1508035', origem: '1501709', ateAno: 1996 }, // Tracuateua ← Bragança
  { uf: 'pa', novo: '1508084', origem: '1507300', ateAno: 1996 }, // Tucumã ← São Félix do Xingu
  { uf: 'pb', novo: '2500536', origem: '2502508', ateAno: 1996 }, // Alcantil ← Boqueirão
  { uf: 'pb', novo: '2500577', origem: '2512705', ateAno: 1996 }, // Algodão de Jandaíra ← Remígio
  { uf: 'pb', novo: '2500734', origem: '2516300', ateAno: 1996 }, // Amparo ← Sumé
  { uf: 'pb', novo: '2500775', origem: '2516201', ateAno: 1996 }, // Aparecida ← Sousa
  { uf: 'pb', novo: '2501153', origem: '2510709', ateAno: 1996 }, // Areia de Baraúnas ← Passagem
  { uf: 'pb', novo: '2501351', origem: '2516508', ateAno: 1996 }, // Assunção ← Taperoá
  { uf: 'pb', novo: '2501534', origem: '2511400', ateAno: 1996 }, // Baraúna ← Picuí
  { uf: 'pb', novo: '2501575', origem: '2502508', ateAno: 1996 }, // Barra de Santana ← Boqueirão
  { uf: 'pb', novo: '2502052', origem: '2516805', ateAno: 1996 }, // Bernardino Batista ← Triunfo
  { uf: 'pb', novo: '2502151', origem: '2504009', ateAno: 1996 }, // Boa Vista ← Campina Grande
  { uf: 'pb', novo: '2503555', origem: '2505402', ateAno: 1996 }, // Cacimbas ← Desterro
  { uf: 'pb', novo: '2503753', origem: '2512101', ateAno: 1996 }, // Cajazeirinhas ← Pombal
  { uf: 'pb', novo: '2504033', origem: '2508901', ateAno: 1996 }, // Capim ← Mamanguape
  { uf: 'pb', novo: '2504074', origem: '2514008', ateAno: 1996 }, // Caraúbas ← São João do Cariri
  { uf: 'pb', novo: '2504157', origem: '2516003', ateAno: 1996 }, // Casserengue ← Solânea
  { uf: 'pb', novo: '2504355', origem: '2502508', ateAno: 1996 }, // Caturité ← Boqueirão
  { uf: 'pb', novo: '2504850', origem: '2515500', ateAno: 1996 }, // Coxixola ← Serra Branca
  { uf: 'pb', novo: '2505238', origem: '2508901', ateAno: 1996 }, // Cuité de Mamanguape ← Mamanguape
  { uf: 'pb', novo: '2505279', origem: '2508901', ateAno: 1996 }, // Curral de Cima ← Mamanguape
  { uf: 'pb', novo: '2505352', origem: '2501609', ateAno: 1996 }, // Damião ← Barra de Santa Rosa
  { uf: 'pb', novo: '2506251', origem: '2501302', ateAno: 1996 }, // Gado Bravo ← Aroeiras
  { uf: 'pb', novo: '2513653', origem: '2516904', ateAno: 1996 }, // Joca Claudino ← Uiraúna
  { uf: 'pb', novo: '2508554', origem: '2503605', ateAno: 1996 }, // Logradouro ← Caiçara
  { uf: 'pb', novo: '2509057', origem: '2512903', ateAno: 1996 }, // Marcação ← Rio Tinto
  { uf: 'pb', novo: '2509156', origem: '2516201', ateAno: 1996 }, // Marizópolis ← Sousa
  { uf: 'pb', novo: '2509339', origem: '2500403', ateAno: 1996 }, // Matinhas ← Alagoa Nova
  { uf: 'pb', novo: '2509370', origem: '2507408', ateAno: 1996 }, // Mato Grosso ← Jericó
  { uf: 'pb', novo: '2509396', origem: '2516706', ateAno: 1996 }, // Maturéia ← Teixeira
  { uf: 'pb', novo: '2510659', origem: '2514800', ateAno: 1996 }, // Parari ← São José dos Cordeiros
  { uf: 'pb', novo: '2512721', origem: '2507309', ateAno: 1996 }, // Pedro Régis ← Jacaraú
  { uf: 'pb', novo: '2512036', origem: '2516904', ateAno: 1996 }, // Poço Dantas ← Uiraúna
  { uf: 'pb', novo: '2512077', origem: '2500700', ateAno: 1996 }, // Poço de José de Moura ← São João do Rio do Peixe
  { uf: 'pb', novo: '2512788', origem: '2502508', ateAno: 1996 }, // Riacho de Santo Antônio ← Boqueirão
  { uf: 'pb', novo: '2512747', origem: '2501005', ateAno: 1996 }, // Riachão ← Araruna
  { uf: 'pb', novo: '2512754', origem: '2506806', ateAno: 1996 }, // Riachão do Bacamarte ← Ingá
  { uf: 'pb', novo: '2512762', origem: '2515302', ateAno: 1996 }, // Riachão do Poço ← Sapé
  { uf: 'pb', novo: '2513158', origem: '2517001', ateAno: 1996 }, // Santa Cecília ← Umbuzeiro
  { uf: 'pb', novo: '2513356', origem: '2504405', ateAno: 1996 }, // Santa Inês ← Conceição
  { uf: 'pb', novo: '2513851', origem: '2506509', ateAno: 1996 }, // Santo André ← Gurjão
  { uf: 'pb', novo: '2515930', origem: '2505808', ateAno: 1996 }, // Sertãozinho ← Duas Estradas
  { uf: 'pb', novo: '2515971', origem: '2515302', ateAno: 1996 }, // Sobrado ← Sapé
  { uf: 'pb', novo: '2516151', origem: '2505105', ateAno: 1996 }, // Sossêgo ← Cuité
  { uf: 'pb', novo: '2513927', origem: '2512101', ateAno: 1996 }, // São Bentinho ← Pombal
  { uf: 'pb', novo: '2513968', origem: '2512101', ateAno: 1996 }, // São Domingos ← Pombal
  { uf: 'pb', novo: '2513943', origem: '2503100', ateAno: 1996 }, // São Domingos do Cariri ← Cabaceiras
  { uf: 'pb', novo: '2513984', origem: '2516201', ateAno: 1996 }, // São Francisco ← Sousa
  { uf: 'pb', novo: '2514552', origem: '2512309', ateAno: 1996 }, // São José de Princesa ← Princesa Isabel
  { uf: 'pb', novo: '2514651', origem: '2502805', ateAno: 1996 }, // São José do Brejo do Cruz ← Brejo do Cruz
  { uf: 'pb', novo: '2514453', origem: '2511509', ateAno: 1996 }, // São José dos Ramos ← Pilar
  { uf: 'pb', novo: '2516755', origem: '2507705', ateAno: 1996 }, // Tenório ← Juazeirinho
  { uf: 'pb', novo: '2517209', origem: '2516201', ateAno: 1996 }, // Vieirópolis ← Sousa
  { uf: 'pb', novo: '2517407', origem: '2515203', ateAno: 1996 }, // Zabelê ← São Sebastião do Umbuzeiro
  { uf: 'pe', novo: '2601052', origem: '2606804', ateAno: 1996 }, // Araçoiaba ← Igarassu
  { uf: 'pe', novo: '2604155', origem: '2614501', ateAno: 1996 }, // Casinhas ← Surubim
  { uf: 'pe', novo: '2607950', origem: '2609204', ateAno: 1996 }, // Jaqueira ← Maraial
  { uf: 'pe', novo: '2608057', origem: '2611002', ateAno: 1996 }, // Jatobá ← Petrolândia
  { uf: 'pe', novo: '2608750', origem: '2612604', ateAno: 1996 }, // Lagoa Grande ← Santa Maria da Boa Vista
  { uf: 'pe', novo: '2609154', origem: '2607000', ateAno: 1996 }, // Manari ← Inajá
  { uf: 'pe', novo: '2612554', origem: '2612455', ateAno: 1996 }, // Santa Filomena ← Santa Cruz
  { uf: 'pe', novo: '2614857', origem: '2611903', ateAno: 1996 }, // Tamandaré ← Rio Formoso
  { uf: 'pi', novo: '2200053', origem: '2207801', ateAno: 1996 }, // Acauã ← Paulistana
  { uf: 'pi', novo: '2201572', origem: '2207207', ateAno: 1996 }, // Belém do Piauí ← Padre Marcos
  { uf: 'pi', novo: '2202075', origem: '2207009', ateAno: 1996 }, // Cajazeiras do Piauí ← Oeiras
  { uf: 'pi', novo: '2202083', origem: '2205706', ateAno: 1996 }, // Cajueiro da Praia ← Luis Correia
  { uf: 'pi', novo: '2202117', origem: '2205565', ateAno: 1996 }, // Campo Alegre do Fidalgo ← Lagoa do Barro do Piauí
  { uf: 'pi', novo: '2202539', origem: '2202000', ateAno: 1996 }, // Caraúbas do Piauí ← Buriti dos Lopes
  { uf: 'pi', novo: '2202653', origem: '2202000', ateAno: 1996 }, // Caxingó ← Buriti dos Lopes
  { uf: 'pi', novo: '2202711', origem: '2202208', ateAno: 1996 }, // Cocal de Telha ← Campo Maior
  { uf: 'pi', novo: '2202729', origem: '2202703', ateAno: 1996 }, // Cocal dos Alves ← Cocal
  { uf: 'pi', novo: '2203255', origem: '2206407', ateAno: 1996 }, // Curralinhos ← Monsenhor Gil
  { uf: 'pi', novo: '2203859', origem: '2209500', ateAno: 1996 }, // Floresta do Piauí ← Santo Inácio do Piauí
  { uf: 'pi', novo: '2204154', origem: '2205953', ateAno: 1996 }, // Francisco Macedo ← Marcolândia
  { uf: 'pi', novo: '2205276', origem: '2210656', ateAno: 1996 }, // Jatobá do Piauí ← Sigefredo Pacheco
  { uf: 'pi', novo: '2205458', origem: '2205805', ateAno: 1996 }, // Joca Marques ← Luzilândia
  { uf: 'pi', novo: '2205359', origem: '2210003', ateAno: 1996 }, // João Costa ← São João do Piauí
  { uf: 'pi', novo: '2205516', origem: '2202026', ateAno: 1996 }, // Juazeiro do Piauí ← Buriti dos Montes
  { uf: 'pi', novo: '2205581', origem: '2203305', ateAno: 1996 }, // Lagoa do Piauí ← Demerval Lobão
  { uf: 'pi', novo: '2205540', origem: '2200202', ateAno: 1996 }, // Lagoinha do Piauí ← Água Branca
  { uf: 'pi', novo: '2205854', origem: '2205805', ateAno: 1996 }, // Madeiro ← Luzilândia
  { uf: 'pi', novo: '2206050', origem: '2205201', ateAno: 1996 }, // Massapê do Piauí ← Jaicós
  { uf: 'pi', novo: '2206670', origem: '2203701', ateAno: 1996 }, // Morro do Chapéu do Piauí ← Esperantina
  { uf: 'pi', novo: '2206696', origem: '2202000', ateAno: 1996 }, // Murici dos Portelas ← Buriti dos Lopes
  { uf: 'pi', novo: '2207108', origem: '2200202', ateAno: 1996 }, // Olho d'Água do Piauí ← Água Branca
  { uf: 'pi', novo: '2207793', origem: '2200400', ateAno: 1996 }, // Pau D'arco do Piauí ← Altos
  { uf: 'pi', novo: '2207934', origem: '2210003', ateAno: 1996 }, // Pedro Laurentino ← São João do Piauí
  { uf: 'pi', novo: '2208551', origem: '2200806', ateAno: 1996 }, // Porto Alegre do Piauí ← Antônio Almeida
  { uf: 'pi', novo: '2208874', origem: '2210003', ateAno: 1996 }, // Ribeira do Piauí ← São João do Piauí
  { uf: 'pi', novo: '2209450', origem: '2209807', ateAno: 1996 }, // Santo Antônio dos Milagres ← São Gonçalo do Piauí
  { uf: 'pi', novo: '2210938', origem: '2209351', ateAno: 1996 }, // Sussuapara ← Santana do Piauí
  { uf: 'pi', novo: '2209658', origem: '2202802', ateAno: 1996 }, // São Francisco de Assis do Piauí ← Conceição do Canindé
  { uf: 'pi', novo: '2209757', origem: '2201309', ateAno: 1996 }, // São Gonçalo do Gurguéia ← Barreiras do Piauí
  { uf: 'pi', novo: '2210375', origem: '2209856', ateAno: 1996 }, // São Luis do Piauí ← São João da Canabrava
  { uf: 'pi', novo: '2210383', origem: '2209609', ateAno: 1996 }, // São Miguel da Baixa Grande ← São Félix do Piauí
  { uf: 'pi', novo: '2210391', origem: '2210102', ateAno: 1996 }, // São Miguel do Fidalgo ← São José do Peixe
  { uf: 'pi', novo: '2210953', origem: '2202307', ateAno: 1996 }, // Tamboril do Piauí ← Canto do Buriti
  { uf: 'pi', novo: '2210979', origem: '2209377', ateAno: 1996 }, // Tanque do Piauí ← Santa Rosa do Piauí
  { uf: 'pi', novo: '2211506', origem: '2205003', ateAno: 1996 }, // Vera Mendes ← Itainópolis
  { uf: 'pi', novo: '2211605', origem: '2207207', ateAno: 1996 }, // Vila Nova do Piauí ← Padre Marcos
  { uf: 'pi', novo: '2211704', origem: '2209104', ateAno: 1996 }, // Wall Ferraz ← Santa Cruz do Piauí
  { uf: 'pr', novo: '4101655', origem: '4111506', ateAno: 1996 }, // Arapuã ← Ivaiporã
  { uf: 'pr', novo: '4101853', origem: '4111506', ateAno: 1996 }, // Ariranha do Ivaí ← Ivaiporã
  { uf: 'pr', novo: '4102752', origem: '4119004', ateAno: 1996 }, // Bela Vista da Caroba ← Pérola d'Oeste
  { uf: 'pr', novo: '4103040', origem: '4119608', ateAno: 1996 }, // Boa Ventura de São Roque ← Pitanga
  { uf: 'pr', novo: '4103156', origem: '4102604', ateAno: 1996 }, // Bom Jesus do Sul ← Barracão
  { uf: 'pr', novo: '4103958', origem: '4109401', ateAno: 1996 }, // Campina do Simão ← Guarapuava
  { uf: 'pr', novo: '4104253', origem: '4100400', ateAno: 1996 }, // Campo Magro ← Almirante Tamandaré
  { uf: 'pr', novo: '4104659', origem: '4104907', ateAno: 1996 }, // Carambeí ← Castro
  { uf: 'pr', novo: '4106456', origem: '4117602', ateAno: 1996 }, // Coronel Domingos Soares ← Palmas
  { uf: 'pr', novo: '4106852', origem: '4107603', ateAno: 1996 }, // Cruzmaltina ← Faxinal
  { uf: 'pr', novo: '4107520', origem: '4118907', ateAno: 1996 }, // Esperança Nova ← Pérola
  { uf: 'pr', novo: '4107546', origem: '4120903', ateAno: 1996 }, // Espigão Alto do Iguaçu ← Quedas do Iguaçu
  { uf: 'pr', novo: '4107736', origem: '4127007', ateAno: 1996 }, // Fernandes Pinheiro ← Teixeira Soares
  { uf: 'pr', novo: '4108452', origem: '4104428', ateAno: 1996 }, // Foz do Jordão ← Candói
  { uf: 'pr', novo: '4108650', origem: '4104451', ateAno: 1996 }, // Goioxim ← Cantagalo
  { uf: 'pr', novo: '4108957', origem: '4110102', ateAno: 1996 }, // Guamiranga ← Imbituva
  { uf: 'pr', novo: '4110078', origem: '4127106', ateAno: 1996 }, // Imbaú ← Telêmaco Borba
  { uf: 'pr', novo: '4114351', origem: '4122800', ateAno: 1996 }, // Manfrinópolis ← Salgado Filho
  { uf: 'pr', novo: '4115457', origem: '4104451', ateAno: 1996 }, // Marquinho ← Cantagalo
  { uf: 'pr', novo: '4118857', origem: '4128625', ateAno: 1996 }, // Perobal ← Alto Paraíso
  { uf: 'pr', novo: '4119954', origem: '4118204', ateAno: 1996 }, // Pontal do Paraná ← Paranaguá
  { uf: 'pr', novo: '4120150', origem: '4122156', ateAno: 1996 }, // Porto Barreiro ← Rio Bonito do Iguaçu
  { uf: 'pr', novo: '4120333', origem: '4116000', ateAno: 1996 }, // Prado Ferreira ← Miraselva
  { uf: 'pr', novo: '4120655', origem: '4108601', ateAno: 1996 }, // Quarto Centenário ← Goioerê
  { uf: 'pr', novo: '4121752', origem: '4119301', ateAno: 1996 }, // Reserva do Iguaçu ← Pinhão
  { uf: 'pr', novo: '4122172', origem: '4108700', ateAno: 1996 }, // Rio Branco do Ivaí ← Grandes Rios
  { uf: 'pr', novo: '4126355', origem: '4115804', ateAno: 1996 }, // Serranópolis do Iguaçu ← Medianeira
  { uf: 'pr', novo: '4126678', origem: '4113700', ateAno: 1996 }, // Tamarana ← Londrina
  { uf: 'rj', novo: '3300233', origem: '3300704', ateAno: 1996 }, // Armação dos Búzios ← Cabo Frio
  { uf: 'rj', novo: '3300936', origem: '3302403', ateAno: 1996 }, // Carapebus ← Macaé
  { uf: 'rj', novo: '3301876', origem: '3305208', ateAno: 1996 }, // Iguaba Grande ← São Pedro da Aldeia
  { uf: 'rj', novo: '3302452', origem: '3301504', ateAno: 1996 }, // Macuco ← Cordeiro
  { uf: 'rj', novo: '3303955', origem: '3304003', ateAno: 1996 }, // Pinheiral ← Piraí
  { uf: 'rj', novo: '3304110', origem: '3304201', ateAno: 1996 }, // Porto Real ← Resende
  { uf: 'rj', novo: '3305554', origem: '3302007', ateAno: 1996 }, // Seropédica ← Itaguaí
  { uf: 'rj', novo: '3304755', origem: '3305000', ateAno: 1996 }, // São Francisco de Itabapoana ← São João da Barra
  { uf: 'rj', novo: '3305133', origem: '3300902', ateAno: 1996 }, // São José de Ubá ← Cambuci
  { uf: 'rj', novo: '3305752', origem: '3301900', ateAno: 1996 }, // Tanguá ← Itaboraí
  { uf: 'rn', novo: '2406155', origem: '2414704', ateAno: 1996 }, // Jundiá ← Várzea
  { uf: 'rn', novo: '2410256', origem: '2402501', ateAno: 1996 }, // Porto do Mangue ← Carnaubais
  { uf: 'rn', novo: '2408953', origem: '2407500', ateAno: 1996 }, // Rio do Fogo ← Maxaranguape
  { uf: 'rn', novo: '2409332', origem: '2412609', ateAno: 1996 }, // Santa Maria ← São Paulo do Potengi
  { uf: 'rn', novo: '2413557', origem: '2407401', ateAno: 1996 }, // Serrinha dos Pintos ← Martins
  { uf: 'rn', novo: '2411056', origem: '2404408', ateAno: 1996 }, // Tibau ← Grossos
  { uf: 'ro', novo: '1100379', origem: '1100015', ateAno: 1996 }, // Alto Alegre dos Parecis ← Alta Floresta d'Oeste
  { uf: 'ro', novo: '1100452', origem: '1100700', ateAno: 1996 }, // Buritis ← Campo Novo de Rondônia
  { uf: 'ro', novo: '1100924', origem: '1100304', ateAno: 1996 }, // Chupinguaia ← Vilhena
  { uf: 'ro', novo: '1100940', origem: '1100262', ateAno: 1996 }, // Cujubim ← Rio Crespo
  { uf: 'ro', novo: '1101435', origem: '1100155', ateAno: 1996 }, // Nova União ← Ouro Preto do Oeste
  { uf: 'ro', novo: '1101450', origem: '1100189', ateAno: 1996 }, // Parecis ← Pimenta Bueno
  { uf: 'ro', novo: '1101468', origem: '1100056', ateAno: 1996 }, // Pimenteiras do Oeste ← Cerejeiras
  { uf: 'ro', novo: '1101476', origem: '1100189', ateAno: 1996 }, // Primavera de Rondônia ← Pimenta Bueno
  { uf: 'ro', novo: '1101484', origem: '1100189', ateAno: 1996 }, // São Felipe d'Oeste ← Pimenta Bueno
  { uf: 'ro', novo: '1101492', origem: '1100080', ateAno: 1996 }, // São Francisco do Guaporé ← Costa Marques
  { uf: 'ro', novo: '1101559', origem: '1100155', ateAno: 1996 }, // Teixeirópolis ← Ouro Preto do Oeste
  { uf: 'ro', novo: '1101757', origem: '1100130', ateAno: 1996 }, // Vale do Anari ← Machadinho d'Oeste
  { uf: 'rr', novo: '1400027', origem: '1400100', ateAno: 1996 }, // Amajari ← Boa Vista
  { uf: 'rr', novo: '1400175', origem: '1400159', ateAno: 1996 }, // Cantá ← Bonfim
  { uf: 'rr', novo: '1400233', origem: '1400506', ateAno: 1996 }, // Caroebe ← São João da Baliza
  { uf: 'rr', novo: '1400282', origem: '1400308', ateAno: 1996 }, // Iracema ← Mucajaí
  { uf: 'rr', novo: '1400456', origem: '1400407', ateAno: 1996 }, // Pacaraima ← Normandia
  { uf: 'rr', novo: '1400472', origem: '1400506', ateAno: 1996 }, // Rorainópolis ← São João da Baliza
  { uf: 'rr', novo: '1400704', origem: '1400407', ateAno: 1996 }, // Uiramutã ← Normandia
  { uf: 'rs', novo: '4300877', origem: '4319901', ateAno: 1996 }, // Araricá ← Sapiranga
  { uf: 'rs', novo: '4301636', origem: '4305454', ateAno: 1996 }, // Balneário Pinhal ← Cidreira
  { uf: 'rs', novo: '4301875', origem: '4322400', ateAno: 1996 }, // Barra do Quaraí ← Uruguaiana
  { uf: 'rs', novo: '4302055', origem: '4319703', ateAno: 1996 }, // Benjamin Constant do Sul ← São Valentim
  { uf: 'rs', novo: '4302220', origem: '4306106', ateAno: 1996 }, // Boa Vista do Cadeado ← Cruz Alta
  { uf: 'rs', novo: '4302238', origem: '4306106', ateAno: 1996 }, // Boa Vista do Incra ← Cruz Alta
  { uf: 'rs', novo: '4302253', origem: '4308607', ateAno: 1996 }, // Boa Vista do Sul ← Garibaldi
  { uf: 'rs', novo: '4304671', origem: '4313656', ateAno: 1996 }, // Capivari do Sul ← Palmares do Sul
  { uf: 'rs', novo: '4304713', origem: '4317608', ateAno: 1996 }, // Caraá ← Santo Antônio da Patrulha
  { uf: 'rs', novo: '4305124', origem: '4314209', ateAno: 1996 }, // Cerrito ← Pedro Osório
  { uf: 'rs', novo: '4305447', origem: '4303509', ateAno: 1996 }, // Chuvisca ← Camaquã
  { uf: 'rs', novo: '4305439', origem: '4317301', ateAno: 1996 }, // Chuí ← Santa Vitória do Palmar
  { uf: 'rs', novo: '4306072', origem: '4315909', ateAno: 1996 }, // Cristal do Sul ← Rodeio Bonito
  { uf: 'rs', novo: '4306379', origem: '4316907', ateAno: 1996 }, // Dilermando de Aguiar ← Santa Maria
  { uf: 'rs', novo: '4306551', origem: '4321501', ateAno: 1996 }, // Dom Pedro de Alcântara ← Torres
  { uf: 'rs', novo: '4306759', origem: '4306809', ateAno: 1996 }, // Doutor Ricardo ← Encantado
  { uf: 'rs', novo: '4307450', origem: '4321477', ateAno: 1996 }, // Esperança do Sul ← Tiradentes do Sul
  { uf: 'rs', novo: '4307815', origem: '4301206', ateAno: 1996 }, // Estrela Velha ← Arroio do Tigre
  { uf: 'rs', novo: '4308078', origem: '4302402', ateAno: 1996 }, // Fazenda Vilanova ← Bom Retiro do Sul
  { uf: 'rs', novo: '4308250', origem: '4308904', ateAno: 1996 }, // Floriano Peixoto ← Getúlio Vargas
  { uf: 'rs', novo: '4309571', origem: '4320677', ateAno: 1996 }, // Herveiras ← Sinimbu
  { uf: 'rs', novo: '4310538', origem: '4316907', ateAno: 1996 }, // Itaara ← Santa Maria
  { uf: 'rs', novo: '4311130', origem: '4322202', ateAno: 1996 }, // Jari ← Tupanciretã
  { uf: 'rs', novo: '4311734', origem: '4312443', ateAno: 1996 }, // Mampituba ← Morrinhos do Sul
  { uf: 'rs', novo: '4312054', origem: '4311403', ateAno: 1996 }, // Marques de Souza ← Lajeado
  { uf: 'rs', novo: '4311718', origem: '4310603', ateAno: 1996 }, // Maçambará ← Itaqui
  { uf: 'rs', novo: '4312377', origem: '4322509', ateAno: 1996 }, // Monte Alegre dos Campos ← Vacaria
  { uf: 'rs', novo: '4312617', origem: '4322509', ateAno: 1996 }, // Muitos Capões ← Vacaria
  { uf: 'rs', novo: '4313011', origem: '4302204', ateAno: 1996 }, // Nova Candelária ← Boa Vista do Buricá
  { uf: 'rs', novo: '4313334', origem: '4300208', ateAno: 1996 }, // Nova Ramada ← Ajuricaba
  { uf: 'rs', novo: '4313391', origem: '4303004', ateAno: 1996 }, // Novo Cabrais ← Cachoeira do Sul
  { uf: 'rs', novo: '4314068', origem: '4320701', ateAno: 1996 }, // Passa Sete ← Sobradinho
  { uf: 'rs', novo: '4315958', origem: '4318903', ateAno: 1996 }, // Rolador ← São Luiz Gonzaga
  { uf: 'rs', novo: '4320321', origem: '4309001', ateAno: 1996 }, // Senador Salgado Filho ← Giruá
  { uf: 'rs', novo: '4320578', origem: '4309506', ateAno: 1996 }, // Sete de Setembro ← Guarani das Missões
  { uf: 'rs', novo: '4320859', origem: '4321303', ateAno: 1996 }, // Tabaí ← Taquari
  { uf: 'rs', novo: '4321493', origem: '4319406', ateAno: 1996 }, // Toropi ← São Pedro do Sul
  { uf: 'rs', novo: '4322327', origem: '4314407', ateAno: 1996 }, // Turuçu ← Pelotas
  { uf: 'rs', novo: '4322343', origem: '4309001', ateAno: 1996 }, // Ubiretama ← Giruá
  { uf: 'rs', novo: '4322376', origem: '4317400', ateAno: 1996 }, // Unistalda ← Santiago
  { uf: 'rs', novo: '4322525', origem: '4308805', ateAno: 1996 }, // Vale Verde ← General Câmara
  { uf: 'rs', novo: '4322855', origem: '4312609', ateAno: 1996 }, // Vespasiano Corrêa ← Muçum
  { uf: 'rs', novo: '4323358', origem: '4320909', ateAno: 1996 }, // Vila Lângaro ← Tapejara
  { uf: 'sc', novo: '4200754', origem: '4204301', ateAno: 1996 }, // Alto Bela Vista ← Concórdia
  { uf: 'sc', novo: '4201950', origem: '4201406', ateAno: 1996 }, // Balneário Arroio do Silva ← Araranguá
  { uf: 'sc', novo: '4202073', origem: '4217709', ateAno: 1996 }, // Balneário Gaivota ← Sombrio
  { uf: 'sc', novo: '4202081', origem: '4212239', ateAno: 1996 }, // Bandeirante ← Paraíso
  { uf: 'sc', novo: '4202099', origem: '4217204', ateAno: 1996 }, // Barra Bonita ← São Miguel do Oeste
  { uf: 'sc', novo: '4202131', origem: '4203808', ateAno: 1996 }, // Bela Vista do Toldo ← Canoinhas
  { uf: 'sc', novo: '4202438', origem: '4209300', ateAno: 1996 }, // Bocaina do Sul ← Lages
  { uf: 'sc', novo: '4202537', origem: '4219507', ateAno: 1996 }, // Bom Jesus ← Xanxerê
  { uf: 'sc', novo: '4202578', origem: '4210902', ateAno: 1996 }, // Bom Jesus do Oeste ← Modelo
  { uf: 'sc', novo: '4202875', origem: '4219150', ateAno: 1996 }, // Brunópolis ← Vargem
  { uf: 'sc', novo: '4203253', origem: '4209300', ateAno: 1996 }, // Capão Alto ← Lages
  { uf: 'sc', novo: '4204194', origem: '4208500', ateAno: 1996 }, // Chapadão do Lageado ← Ituporanga
  { uf: 'sc', novo: '4204756', origem: '4216008', ateAno: 1996 }, // Cunhataí ← São Carlos
  { uf: 'sc', novo: '4205175', origem: '4210555', ateAno: 1996 }, // Entre Rios ← Marema
  { uf: 'sc', novo: '4205191', origem: '4218806', ateAno: 1996 }, // Ermo ← Turvo
  { uf: 'sc', novo: '4205357', origem: '4210506', ateAno: 1996 }, // Flor do Sertão ← Maravilha
  { uf: 'sc', novo: '4205555', origem: '4204806', ateAno: 1996 }, // Frei Rogério ← Curitibanos
  { uf: 'sc', novo: '4206751', origem: '4217907', ateAno: 1996 }, // Ibiam ← Tangará
  { uf: 'sc', novo: '4207577', origem: '4219309', ateAno: 1996 }, // Iomerê ← Videira
  { uf: 'sc', novo: '4209177', origem: '4205605', ateAno: 1996 }, // Jupiá ← Galvão
  { uf: 'sc', novo: '4210035', origem: '4209003', ateAno: 1996 }, // Luzerna ← Joaçaba
  { uf: 'sc', novo: '4211876', origem: '4208005', ateAno: 1996 }, // Paial ← Itá
  { uf: 'sc', novo: '4211892', origem: '4209300', ateAno: 1996 }, // Painel ← Lages
  { uf: 'sc', novo: '4212056', origem: '4211751', ateAno: 1996 }, // Palmeira ← Otacílio Costa
  { uf: 'sc', novo: '4214151', origem: '4216701', ateAno: 1996 }, // Princesa ← São José do Cedro
  { uf: 'sc', novo: '4215356', origem: '4203501', ateAno: 1996 }, // Saltinho ← Campo Erê
  { uf: 'sc', novo: '4215687', origem: '4203501', ateAno: 1996 }, // Santa Terezinha do Progresso ← Campo Erê
  { uf: 'sc', novo: '4215695', origem: '4214201', ateAno: 1996 }, // Santiago do Sul ← Quilombo
  { uf: 'sc', novo: '4215752', origem: '4203501', ateAno: 1996 }, // São Bernardino ← Campo Erê
  { uf: 'sc', novo: '4217253', origem: '4216602', ateAno: 1996 }, // São Pedro de Alcântara ← São José
  { uf: 'sc', novo: '4217956', origem: '4210506', ateAno: 1996 }, // Tigrinhos ← Maravilha
  { uf: 'sc', novo: '4218350', origem: '4217600', ateAno: 1996 }, // Treviso ← Siderópolis
  { uf: 'sc', novo: '4219853', origem: '4203600', ateAno: 1996 }, // Zortéa ← Campos Novos
  { uf: 'sp', novo: '3503356', origem: '3555000', ateAno: 1996 }, // Arco-íris ← Tupã
  { uf: 'sp', novo: '3507753', origem: '3512506', ateAno: 1996 }, // Brejo Alegre ← Coroados
  { uf: 'sp', novo: '3509957', origem: '3527207', ateAno: 1996 }, // Canas ← Lorena
  { uf: 'sp', novo: '3515657', origem: '3516606', ateAno: 1996 }, // Fernão ← Gália
  { uf: 'sp', novo: '3516853', origem: '3503208', ateAno: 1996 }, // Gavião Peixoto ← Araraquara
  { uf: 'sp', novo: '3521150', origem: '3549805', ateAno: 1996 }, // Ipiguá ← São José do Rio Preto
  { uf: 'sp', novo: '3525854', origem: '3554508', ateAno: 1996 }, // Jumirim ← Tietê
  { uf: 'sp', novo: '3532157', origem: '3519907', ateAno: 1996 }, // Nantes ← Iepê
  { uf: 'sp', novo: '3532868', origem: '3516903', ateAno: 1996 }, // Nova Castilho ← General Salgado
  { uf: 'sp', novo: '3534757', origem: '3518008', ateAno: 1996 }, // Ouroeste ← Guarani d'Oeste
  { uf: 'sp', novo: '3536570', origem: '3500709', ateAno: 1996 }, // Paulistânia ← Agudos
  { uf: 'sp', novo: '3540853', origem: '3527405', ateAno: 1996 }, // Pracinha ← Lucélia
  { uf: 'sp', novo: '3541059', origem: '3550100', ateAno: 1996 }, // Pratânia ← São Manuel
  { uf: 'sp', novo: '3541653', origem: '3554003', ateAno: 1996 }, // Quadra ← Tatuí
  { uf: 'sp', novo: '3543238', origem: '3547700', ateAno: 1996 }, // Ribeirão dos Índios ← Santo Anastácio
  { uf: 'sp', novo: '3546256', origem: '3509403', ateAno: 1996 }, // Santa Cruz da Esperança ← Cajuru
  { uf: 'sp', novo: '3547650', origem: '3555802', ateAno: 1996 }, // Santa Salete ← Urânia
  { uf: 'sp', novo: '3553658', origem: '3539509', ateAno: 1996 }, // Taquaral ← Pitangueiras
  { uf: 'sp', novo: '3554755', origem: '3506706', ateAno: 1996 }, // Trabiju ← Boa Esperança do Sul
  { uf: 'sp', novo: '3556958', origem: '3524808', ateAno: 1996 }, // Vitória Brasil ← Jales
  { uf: 'to', novo: '1700301', origem: '1721208', ateAno: 1996 }, // Aguiarnópolis ← Tocantinópolis
  { uf: 'to', novo: '1703057', origem: '1716307', ateAno: 1996 }, // Bandeirantes do Tocantins ← Pau D'arco
  { uf: 'to', novo: '1703073', origem: '1709005', ateAno: 1996 }, // Barra do Ouro ← Goiatins
  { uf: 'to', novo: '1705102', origem: '1714203', ateAno: 1996 }, // Chapada da Natividade ← Natividade
  { uf: 'to', novo: '1704600', origem: '1717503', ateAno: 1996 }, // Chapada de Areia ← Pium
  { uf: 'to', novo: '1706258', origem: '1700350', ateAno: 1996 }, // Crixás do Tocantins ← Aliança do Tocantins
  { uf: 'to', novo: '1709807', origem: '1718204', ateAno: 1996 }, // Ipueiras ← Porto Nacional
  { uf: 'to', novo: '1712157', origem: '1702703', ateAno: 1996 }, // Lavandeira ← Aurora do Tocantins
  { uf: 'to', novo: '1712454', origem: '1714302', ateAno: 1996 }, // Luzinópolis ← Nazaré
  { uf: 'to', novo: '1713700', origem: '1707108', ateAno: 1996 }, // Monte Santo do Tocantins ← Divinópolis do Tocantins
  { uf: 'to', novo: '1715507', origem: '1707553', ateAno: 1996 }, // Oliveira de Fátima ← Fátima
  { uf: 'to', novo: '1718451', origem: '1716109', ateAno: 1996 }, // Pugmil ← Paraíso do Tocantins
  { uf: 'to', novo: '1718899', origem: '1703701', ateAno: 1996 }, // Santa Rita do Tocantins ← Brejinho de Nazaré
  { uf: 'to', novo: '1720002', origem: '1713809', ateAno: 1996 }, // Santa Terezinha do Tocantins ← Palmeiras do Tocantins
  { uf: 'to', novo: '1720978', origem: '1700707', ateAno: 1996 }, // Talismã ← Alvorada
  { uf: 'to', novo: '1721257', origem: '1709302', ateAno: 1996 }, // Tupirama ← Guaraí
  // criados em 2013 (primeira eleição municipal em 2012): em 2010 ainda votavam na origem
  { uf: 'sc', novo: '4212650', origem: '4209409', ateAno: 2011 }, // Pescaria Brava ← Laguna
  { uf: 'sc', novo: '4220000', origem: '4207007', ateAno: 2011 }, // Balneário Rincão ← Içara
  { uf: 'pa', novo: '1504752', origem: '1506807', ateAno: 2011 }, // Mojuí dos Campos ← Santarém
  { uf: 'rs', novo: '4314548', origem: '4302105', ateAno: 2011 }, // Pinto Bandeira ← Bento Gonçalves
  { uf: 'ms', novo: '5006275', origem: '5003256', ateAno: 2011 }, // Paraíso das Águas ← Costa Rica
];

/** Fusões que valem no ano; quando a origem também ainda não existia, segue até o município que existia. */
export const fusoesDoAno = (ano) => {
  const lista = FUSOES.filter((f) => ano <= f.ateAno);
  const de = new Map(lista.map((f) => [f.novo, f.origem]));
  return lista.map((f) => {
    let o = f.origem;
    for (let i = 0; de.has(o) && i < 10; i++) o = de.get(o);
    return o === f.origem ? f : { ...f, origem: o };
  });
};
