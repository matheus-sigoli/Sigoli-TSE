/**
 * Municípios criados depois de uma eleição (ADR 0015): no mapa daquele ano, a área volta para o município de origem.
 * `ateAno`: último ano de eleição em que o município novo ainda não existia (o eleitor votava na origem).
 * `desdeAno`: primeiro ano em que a fusão vale (quando num ano mais antigo o município tinha resultado próprio).
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
  { uf: 'pa', novo: '1501253', origem: '1502764', ateAno: 1996, desdeAno: 1994 }, // Bannach ← Cumaru do Norte
  { uf: 'pa', novo: '1501451', origem: '1506807', ateAno: 1996 }, // Belterra ← Santarém
  { uf: 'pa', novo: '1501956', origem: '1508308', ateAno: 1996 }, // Cachoeira do Piriá ← Viseu
  { uf: 'pa', novo: '1502152', origem: '1505536', ateAno: 1996 }, // Canaã dos Carajás ← Parauapebas
  { uf: 'pa', novo: '1502855', origem: '1500404', ateAno: 1996 }, // Curuá ← Alenquer
  { uf: 'pa', novo: '1504422', origem: '1501501', ateAno: 1996 }, // Marituba ← Benevides
  { uf: 'pa', novo: '1505437', origem: '1502764', ateAno: 1996, desdeAno: 1994 }, // Ourilândia do Norte ← Cumaru do Norte
  { uf: 'pa', novo: '1505635', origem: '1507458', ateAno: 1996 }, // Piçarra ← São Geraldo do Araguaia
  { uf: 'pa', novo: '1506112', origem: '1506104', ateAno: 1996 }, // Quatipuru ← Primavera
  { uf: 'pa', novo: '1507755', origem: '1508407', ateAno: 1996 }, // Sapucaia ← Xinguara
  { uf: 'pa', novo: '1507466', origem: '1507102', ateAno: 1996 }, // São João da Ponta ← São Caetano de Odivelas
  { uf: 'pa', novo: '1508035', origem: '1501709', ateAno: 1996 }, // Tracuateua ← Bragança
  { uf: 'pa', novo: '1508084', origem: '1507300', ateAno: 1996, desdeAno: 1994 }, // Tucumã ← São Félix do Xingu
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
  { uf: 'pb', novo: '2503753', origem: '2512101', ateAno: 1996, desdeAno: 1983 }, // Cajazeirinhas ← Pombal
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
  // criados entre 1983 e 1989 (sem resultado em 1982, com resultado em 1989): em 1982 votavam na origem.
  // Proposta automática (scripts/propor-fusoes.mjs --ano 1982 --depois 1998 --amc): grupo de AMC 1991–2000 quando
  // há, senão a zona eleitoral de 1998 ou a maior fronteira; "via" = pelo vizinho que também ainda não existia
  { uf: 'ac', novo: '1200054', origem: '1200104', ateAno: 1982 }, // Assis Brasil ← Brasiléia (zona)
  { uf: 'al', novo: '2709152', origem: '2704005', ateAno: 1982 }, // Teotônio Vilela ← Junqueiro (zona)
  { uf: 'am', novo: '1300144', origem: '1303304', ateAno: 1982 }, // Apuí ← Novo Aripuanã (fronteira)
  { uf: 'am', novo: '1301159', origem: '1300300', ateAno: 1982 }, // Careiro da Várzea ← Autazes (fronteira)
  { uf: 'am', novo: '1301654', origem: '1301803', ateAno: 1982 }, // Guajará ← Ipixuna (zona)
  { uf: 'ba', novo: '2900504', origem: '2923605', ateAno: 1982 }, // Érico Cardoso ← Paramirim (zona)
  { uf: 'ba', novo: '2901155', origem: '2921708', ateAno: 1982 }, // América Dourada ← Morro do Chapéu (fronteira)
  { uf: 'ba', novo: '2901353', origem: '2930105', ateAno: 1982 }, // Andorinha ← Senhor do Bonfim (zona)
  { uf: 'ba', novo: '2901957', origem: '2917607', ateAno: 1982 }, // Apuarema ← Jaguaquara (zona)
  { uf: 'ba', novo: '2902054', origem: '2900702', ateAno: 1982 }, // Araçás ← Alagoinhas (zona)
  { uf: 'ba', novo: '2902252', origem: '2932507', ateAno: 1982 }, // Arataca ← Una (fronteira)
  { uf: 'ba', novo: '2902658', origem: '2926608', ateAno: 1982 }, // Banzaê ← Ribeira do Pombal (zona)
  { uf: 'ba', novo: '2903201', origem: '2926202', ateAno: 1982 }, // Barreiras ← Riachão das Neves (fronteira)
  { uf: 'ba', novo: '2903235', origem: '2906204', ateAno: 1982 }, // Barro Alto ← Canarana (zona)
  { uf: 'ba', novo: '2903953', origem: '2925105', ateAno: 1982 }, // Bom Jesus da Serra ← Poções (zona)
  { uf: 'ba', novo: '2904050', origem: '2932804', ateAno: 1982 }, // Bonito ← Utinga (zona)
  { uf: 'ba', novo: '2904753', origem: '2902708', ateAno: 1982 }, // Buritirama ← Barra (zona)
  { uf: 'ba', novo: '2904852', origem: '2911600', ateAno: 1982 }, // Cabaceiras do Paraguaçu ← Governador Mangabeira (zona)
  { uf: 'ba', novo: '2905107', origem: '2917508', ateAno: 1982 }, // Caem ← Jacobina (fronteira)
  { uf: 'ba', novo: '2905156', origem: '2931004', ateAno: 1982 }, // Caetanos ← Tanhaçu (fronteira)
  { uf: 'ba', novo: '2906824', origem: '2910701', ateAno: 1982 }, // Canudos ← Euclides da Cunha (zona)
  { uf: 'ba', novo: '2906857', origem: '2928000', ateAno: 1982 }, // Capela do Alto Alegre ← Santaluz (via SÃO JOSÉ DO JACUÍPE)
  { uf: 'ba', novo: '2906873', origem: '2925808', ateAno: 1982 }, // Capim Grosso ← Queimadas (fronteira)
  { uf: 'ba', novo: '2906899', origem: '2931806', ateAno: 1982 }, // Caraíbas ← Tremedal (zona)
  { uf: 'ba', novo: '2907558', origem: '2926905', ateAno: 1982 }, // Caturama ← Rio do Pires (zona)
  { uf: 'ba', novo: '2910057', origem: '2921005', ateAno: 1982 }, // Dias D'ávila ← Mata de São João (fronteira)
  { uf: 'ba', novo: '2910727', origem: '2915304', ateAno: 1982 }, // Eunápolis ← Itagimirim (zona)
  { uf: 'ba', novo: '2910750', origem: '2907806', ateAno: 1982 }, // Fátima ← Cícero Dantas (zona)
  { uf: 'ba', novo: '2910776', origem: '2907103', ateAno: 1982 }, // Feira da Mata ← Carinhanha (zona)
  { uf: 'ba', novo: '2910859', origem: '2924603', ateAno: 1982 }, // Filadélfia ← Pindobaçu (zona)
  { uf: 'ba', novo: '2911253', origem: '2928000', ateAno: 1982 }, // Gavião ← Santaluz (fronteira)
  { uf: 'ba', novo: '2911659', origem: '2905008', ateAno: 1982 }, // Guajeru ← Caculé (zona)
  { uf: 'ba', novo: '2911857', origem: '2907806', ateAno: 1982 }, // Heliópolis ← Cícero Dantas (zona)
  { uf: 'ba', novo: '2913457', origem: '2905800', ateAno: 1982 }, // Igrapiúna ← Camamu (zona)
  { uf: 'ba', novo: '2914653', origem: '2911808', ateAno: 1982 }, // Itabela ← Guaratinga (zona)
  { uf: 'ba', novo: '2915353', origem: '2933604', ateAno: 1982 }, // Itaguaçu da Bahia ← Xique-xique (zona)
  { uf: 'ba', novo: '2916856', origem: '2928505', ateAno: 1982 }, // Itatim ← Santa Terezinha (zona)
  { uf: 'ba', novo: '2917334', origem: '2920205', ateAno: 1982 }, // Iuiu ← Malhada (zona)
  { uf: 'ba', novo: '2917359', origem: '2908101', ateAno: 1982 }, // Jaborandi ← Cocos (zona)
  { uf: 'ba', novo: '2918357', origem: '2921708', ateAno: 1982 }, // João Dourado ← Morro do Chapéu (fronteira)
  { uf: 'ba', novo: '2918456', origem: '2915601', ateAno: 1982 }, // Jucuruçu ← Itamaraju (zona)
  { uf: 'ba', novo: '2918555', origem: '2916203', ateAno: 1982 }, // Jussari ← Itapé (zona)
  { uf: 'ba', novo: '2918753', origem: '2905206', ateAno: 1982 }, // Lagoa Real ← Caetité (zona)
  { uf: 'ba', novo: '2919058', origem: '2916906', ateAno: 1982 }, // Lajedo do Tabocal ← Itiruçu (zona)
  { uf: 'ba', novo: '2919157', origem: '2906204', ateAno: 1982 }, // Lapão ← Canarana (fronteira)
  { uf: 'ba', novo: '2919926', origem: '2929206', ateAno: 1982 }, // Madre de Deus ← São Francisco do Conde (zona)
  { uf: 'ba', novo: '2919959', origem: '2925709', ateAno: 1982 }, // Maetinga ← Presidente Jânio Quadros (zona)
  { uf: 'ba', novo: '2920106', origem: '2902609', ateAno: 1982 }, // Mairi ← Baixa Grande (zona)
  { uf: 'ba', novo: '2920452', origem: '2928406', ateAno: 1982 }, // Mansidão ← Santa Rita de Cássia (zona)
  { uf: 'ba', novo: '2921054', origem: '2913408', ateAno: 1982 }, // Matina ← Igaporã (zona)
  { uf: 'ba', novo: '2921450', origem: '2903706', ateAno: 1982 }, // Mirante ← Boa Nova (zona)
  { uf: 'ba', novo: '2922052', origem: '2905305', ateAno: 1982 }, // Mulungu do Morro ← Cafarnaum (zona)
  { uf: 'ba', novo: '2922250', origem: '2902708', ateAno: 1982 }, // Muquém do São Francisco ← Barra (zona)
  { uf: 'ba', novo: '2922656', origem: '2925808', ateAno: 1982 }, // Nordestina ← Queimadas (zona)
  { uf: 'ba', novo: '2922730', origem: '2926301', ateAno: 1982 }, // Nova Fátima ← Riachão do Jacuípe (fronteira)
  { uf: 'ba', novo: '2922755', origem: '2915700', ateAno: 1982 }, // Nova Ibiá ← Itamari (zona)
  { uf: 'ba', novo: '2922854', origem: '2901304', ateAno: 1982 }, // Nova Redenção ← Andaraí (zona)
  { uf: 'ba', novo: '2923035', origem: '2913002', ateAno: 1982 }, // Novo Horizonte ← Ibitiara (zona)
  { uf: 'ba', novo: '2923050', origem: '2907806', ateAno: 1982 }, // Novo Triunfo ← Cícero Dantas (zona)
  { uf: 'ba', novo: '2923357', origem: '2921401', ateAno: 1982 }, // Ourolândia ← Mirangaba (zona)
  { uf: 'ba', novo: '2924058', origem: '2926301', ateAno: 1982 }, // Pé de Serra ← Riachão do Jacuípe (zona)
  { uf: 'ba', novo: '2924504', origem: '2932606', ateAno: 1982 }, // Pindaí ← Urandi (zona)
  { uf: 'ba', novo: '2924652', origem: '2914000', ateAno: 1982 }, // Pintadas ← Ipirá (zona)
  { uf: 'ba', novo: '2924678', origem: '2917300', ateAno: 1982 }, // Piraí do Norte ← Ituberá (zona)
  { uf: 'ba', novo: '2925253', origem: '2905503', ateAno: 1982 }, // Ponto Novo ← Caldeirão Grande (zona)
  { uf: 'ba', novo: '2925758', origem: '2932903', ateAno: 1982 }, // Presidente Tancredo Neves ← Valença (zona)
  { uf: 'ba', novo: '2925931', origem: '2930600', ateAno: 1982 }, // Quixabeira ← Serrolândia (fronteira)
  { uf: 'ba', novo: '2925956', origem: '2907301', ateAno: 1982 }, // Rafael Jambeiro ← Castro Alves (zona)
  { uf: 'ba', novo: '2926657', origem: '2910404', ateAno: 1982 }, // Ribeirão do Largo ← Encruzilhada (zona)
  { uf: 'ba', novo: '2928059', origem: '2920908', ateAno: 1982 }, // Santa Luzia ← Mascote (zona)
  { uf: 'ba', novo: '2928950', origem: '2933000', ateAno: 1982 }, // São Domingos ← Valente (zona)
  { uf: 'ba', novo: '2929057', origem: '2928109', ateAno: 1982 }, // São Félix do Coribe ← Santa Maria da Vitória (zona)
  { uf: 'ba', novo: '2929255', origem: '2914604', ateAno: 1982 }, // São Gabriel ← Irecê (zona)
  { uf: 'ba', novo: '2929354', origem: '2904704', ateAno: 1982 }, // São José da Vitória ← Buerarema (zona)
  { uf: 'ba', novo: '2929370', origem: '2928000', ateAno: 1982 }, // São José do Jacuípe ← Santaluz (fronteira)
  { uf: 'ba', novo: '2929750', origem: '2928604', ateAno: 1982 }, // Saubara ← Santo Amaro (zona)
  { uf: 'ba', novo: '2930154', origem: '2903904', ateAno: 1982 }, // Serra do Ramalho ← Bom Jesus da Lapa (zona)
  { uf: 'ba', novo: '2930758', origem: '2903904', ateAno: 1982 }, // Sítio do Mato ← Bom Jesus da Lapa (zona)
  { uf: 'ba', novo: '2930766', origem: '2909208', ateAno: 1982 }, // Sítio do Quinto ← Coronel João Sá (zona)
  { uf: 'ba', novo: '2930774', origem: '2907202', ateAno: 1982 }, // Sobradinho ← Casa Nova (zona)
  { uf: 'ba', novo: '2931053', origem: '2923605', ateAno: 1982 }, // Tanque Novo ← Paramirim (zona)
  { uf: 'ba', novo: '2931350', origem: '2921104', ateAno: 1982 }, // Teixeira de Freitas ← Medeiros Neto (fronteira)
  { uf: 'ba', novo: '2932457', origem: '2906006', ateAno: 1982 }, // Umburanas ← Campo Formoso (zona)
  { uf: 'ba', novo: '2933059', origem: '2930600', ateAno: 1982 }, // Várzea da Roça ← Serrolândia (fronteira)
  { uf: 'ba', novo: '2933158', origem: '2921708', ateAno: 1982 }, // Várzea Nova ← Morro do Chapéu (fronteira)
  { uf: 'ba', novo: '2933174', origem: '2928703', ateAno: 1982 }, // Varzedo ← Santo Antônio de Jesus (zona)
  { uf: 'ba', novo: '2933257', origem: '2916005', ateAno: 1982 }, // Vereda ← Itanhém (zona)
  { uf: 'ba', novo: '2933455', origem: '2909406', ateAno: 1982 }, // Wanderley ← Cotegipe (zona)
  { uf: 'ce', novo: '2300150', origem: '2311603', ateAno: 1982 }, // Acarape ← Redenção (zona)
  { uf: 'ce', novo: '2300754', origem: '2306405', ateAno: 1982 }, // Amontada ← Itapipoca (zona)
  { uf: 'ce', novo: '2301851', origem: '2311306', ateAno: 1982 }, // Banabuiú ← Quixadá (zona)
  { uf: 'ce', novo: '2301950', origem: '2311603', ateAno: 1982 }, // Barreira ← Redenção (zona)
  { uf: 'ce', novo: '2302057', origem: '2302602', ateAno: 1982 }, // Barroquinha ← Camocim (zona)
  { uf: 'ce', novo: '2303956', origem: '2309607', ateAno: 1982 }, // Chorozinho ← Pacajus (zona)
  { uf: 'ce', novo: '2304236', origem: '2305001', ateAno: 1982 }, // Croatá ← Guaraciaba do Norte (zona)
  { uf: 'ce', novo: '2304251', origem: '2300200', ateAno: 1982 }, // Cruz ← Acaraú (zona)
  { uf: 'ce', novo: '2304269', origem: '2313005', ateAno: 1982 }, // Deputado Irapuan Pinheiro ← Solonópole (zona)
  { uf: 'ce', novo: '2304277', origem: '2310803', ateAno: 1982 }, // Ereré ← Pereiro (zona)
  { uf: 'ce', novo: '2304285', origem: '2301000', ateAno: 1982 }, // Eusébio ← Aquiraz (zona)
  { uf: 'ce', novo: '2304350', origem: '2312908', ateAno: 1982 }, // Forquilha ← Sobral (zona)
  { uf: 'ce', novo: '2304657', origem: '2312304', ateAno: 1982 }, // Graça ← São Benedito (zona)
  { uf: 'ce', novo: '2304954', origem: '2309706', ateAno: 1982 }, // Guaiúba ← Pacatuba (zona)
  { uf: 'ce', novo: '2305233', origem: '2309607', ateAno: 1982 }, // Horizonte ← Pacajus (zona)
  { uf: 'ce', novo: '2305266', origem: '2311306', ateAno: 1982 }, // Ibaretama ← Quixadá (zona)
  { uf: 'ce', novo: '2305332', origem: '2308708', ateAno: 1982 }, // Ibicuitinga ← Morada Nova (zona)
  { uf: 'ce', novo: '2305357', origem: '2301109', ateAno: 1982 }, // Icapuí ← Aracati (zona)
  { uf: 'ce', novo: '2305654', origem: '2309300', ateAno: 1982 }, // Ipaporanga ← Nova Russas (zona)
  { uf: 'ce', novo: '2306553', origem: '2300200', ateAno: 1982 }, // Itarema ← Acaraú (zona)
  { uf: 'ce', novo: '2307635', origem: '2311405', ateAno: 1982 }, // Madalena ← Quixeramobim (zona)
  { uf: 'ce', novo: '2307650', origem: '2309706', ateAno: 1982 }, // Maracanaú ← Pacatuba (fronteira)
  { uf: 'ce', novo: '2308351', origem: '2313005', ateAno: 1982 }, // Milhã ← Solonópole (zona)
  { uf: 'ce', novo: '2308377', origem: '2306405', ateAno: 1982 }, // Miraíma ← Itapipoca (zona)
  { uf: 'ce', novo: '2309458', origem: '2301208', ateAno: 1982 }, // Ocara ← Aracoiaba (zona)
  { uf: 'ce', novo: '2310258', origem: '2312403', ateAno: 1982 }, // Paraipaba ← São Gonçalo do Amarante (zona)
  { uf: 'ce', novo: '2310852', origem: '2303501', ateAno: 1982 }, // Pindoretama ← Cascavel (zona)
  { uf: 'ce', novo: '2310951', origem: '2305803', ateAno: 1982 }, // Pires Ferreira ← Ipu (zona)
  { uf: 'ce', novo: '2311231', origem: '2306009', ateAno: 1982 }, // Potiretama ← Iracema (zona)
  { uf: 'ce', novo: '2311264', origem: '2305605', ateAno: 1982 }, // Quiterianópolis ← Independência (zona)
  { uf: 'ce', novo: '2311355', origem: '2305506', ateAno: 1982 }, // Quixelô ← Iguatu (zona)
  { uf: 'ce', novo: '2311959', origem: '2302701', ateAno: 1982 }, // Salitre ← Campos Sales (zona)
  { uf: 'ce', novo: '2313252', origem: '2301604', ateAno: 1982 }, // Tarrafas ← Assaré (zona)
  { uf: 'ce', novo: '2313351', origem: '2306108', ateAno: 1982 }, // Tejuçuoca ← Irauçuba (zona)
  { uf: 'ce', novo: '2313559', origem: '2313807', ateAno: 1982 }, // Tururu ← Uruburetama (zona)
  { uf: 'ce', novo: '2313757', origem: '2313807', ateAno: 1982 }, // Umirim ← Uruburetama (zona)
  { uf: 'ce', novo: '2313955', origem: '2311702', ateAno: 1982 }, // Varjota ← Reriutaba (zona)
  { uf: 'es', novo: '3200136', origem: '3204708', ateAno: 1982 }, // Águia Branca ← São Gabriel da Palha (zona)
  { uf: 'es', novo: '3200169', origem: '3200904', ateAno: 1982 }, // Água Doce do Norte ← Barra de São Francisco (zona)
  { uf: 'es', novo: '3200359', origem: '3204005', ateAno: 1982 }, // Alto Rio Novo ← Pancas (zona)
  { uf: 'es', novo: '3202553', origem: '3200201', ateAno: 1982 }, // Ibitirama ← Alegre (zona)
  { uf: 'es', novo: '3203130', origem: '3202504', ateAno: 1982 }, // João Neiva ← Ibiraçu (zona)
  { uf: 'es', novo: '3203163', origem: '3200102', ateAno: 1982 }, // Laranja da Terra ← Afonso Cláudio (zona)
  { uf: 'es', novo: '3204054', origem: '3201605', ateAno: 1982 }, // Pedro Canário ← Conceição da Barra (fronteira)
  { uf: 'es', novo: '3204559', origem: '3204500', ateAno: 1982 }, // Santa Maria de Jetibá ← Santa Leopoldina (zona)
  { uf: 'es', novo: '3205036', origem: '3201209', ateAno: 1982 }, // Vargem Alta ← Cachoeiro de Itapemirim (zona)
  { uf: 'es', novo: '3205069', origem: '3201704', ateAno: 1982 }, // Venda Nova do Imigrante ← Conceição do Castelo (zona)
  { uf: 'go', novo: '5200159', origem: '5201306', ateAno: 1982 }, // Adelândia ← Anicuns (zona)
  { uf: 'go', novo: '5200175', origem: '5217609', ateAno: 1982 }, // Água Fria de Goiás ← Planaltina (zona)
  { uf: 'go', novo: '5203559', origem: '5212303', ateAno: 1982 }, // Bonfinópolis ← Leopoldo de Bulhões (zona)
  { uf: 'go', novo: '5204953', origem: '5219704', ateAno: 1982 }, // Campos Verdes ← Santa Terezinha de Goiás (zona)
  { uf: 'go', novo: '5205455', origem: '5215702', ateAno: 1982 }, // Cezarina ← Palmeiras de Goiás (zona)
  { uf: 'go', novo: '5205521', origem: '5200605', ateAno: 1982 }, // Colinas do Sul ← Alto Paraíso de Goiás (zona)
  { uf: 'go', novo: '5207352', origem: '5207402', ateAno: 1982 }, // Edealina ← Edéia (zona)
  { uf: 'go', novo: '5207535', origem: '5208905', ateAno: 1982 }, // Faina ← Goiás (zona)
  { uf: 'go', novo: '5209150', origem: '5218508', ateAno: 1982 }, // Gouvelândia ← Quirinópolis (zona)
  { uf: 'go', novo: '5209457', origem: '5210901', ateAno: 1982 }, // Guarinos ← Itapaci (zona)
  { uf: 'go', novo: '5210562', origem: '5221007', ateAno: 1982 }, // Itaguari ← Taquaral de Goiás (zona)
  { uf: 'go', novo: '5212956', origem: '5211008', ateAno: 1982 }, // Matrinchã ← Itapirapuã (zona)
  { uf: 'go', novo: '5213053', origem: '5215603', ateAno: 1982 }, // Mimoso de Goiás ← Padre Bernardo (zona)
  { uf: 'go', novo: '5213756', origem: '5218805', ateAno: 1982 }, // Montividiu ← Rio Verde (zona)
  { uf: 'go', novo: '5213855', origem: '5218904', ateAno: 1982 }, // Morro Agudo de Goiás ← Rubiataba (zona)
  { uf: 'go', novo: '5215256', origem: '5218003', ateAno: 1982 }, // Novo Planalto ← Porangatu (zona)
  { uf: 'go', novo: '5215652', origem: '5204409', ateAno: 1982 }, // Palestina de Goiás ← Caiapônia (zona)
  { uf: 'go', novo: '5218789', origem: '5204508', ateAno: 1982 }, // Rio Quente ← Caldas Novas (zona)
  { uf: 'go', novo: '5219258', origem: '5212204', ateAno: 1982 }, // Santa Fé de Goiás ← Jussara (zona)
  { uf: 'go', novo: '5220058', origem: '5216403', ateAno: 1982 }, // São João da Paraúna ← Paraúna (zona)
  { uf: 'go', novo: '5220157', origem: '5203203', ateAno: 1982 }, // São Luiz do Norte ← Barro Alto (amc)
  { uf: 'go', novo: '5220264', origem: '5220603', ateAno: 1982 }, // São Miguel do Passa Quatro ← Silvânia (zona)
  { uf: 'go', novo: '5220454', origem: '5208707', ateAno: 1982 }, // Senador Canedo ← Goiânia (zona)
  { uf: 'go', novo: '5220686', origem: '5200803', ateAno: 1982 }, // Simolândia ← Alvorada do Norte (zona)
  { uf: 'go', novo: '5221080', origem: '5205307', ateAno: 1982 }, // Teresina de Goiás ← Cavalcante (zona)
  { uf: 'go', novo: '5221452', origem: '5219605', ateAno: 1982 }, // Trombas ← Santa Tereza de Goiás (zona)
  { uf: 'go', novo: '5221551', origem: '5200134', ateAno: 1982 }, // Turvelândia ← Acreúna (zona)
  { uf: 'ma', novo: '2100956', origem: '2104800', ateAno: 1982 }, // Arame ← Grajaú (zona)
  { uf: 'ma', novo: '2106755', origem: '2105401', ateAno: 1982 }, // Miranda do Norte ← Itapecuru Mirim (zona)
  { uf: 'ma', novo: '2110039', origem: '2102606', ateAno: 1982 }, // Santa Luzia do Paruá ← Cândido Mendes (amc+fronteira)
  { uf: 'ma', novo: '2114007', origem: '2106904', ateAno: 1982 }, // Zé Doca ← Monção (fronteira)
  { uf: 'mg', novo: '3133758', origem: '3152907', ateAno: 1982 }, // Itaú de Minas ← Pratápolis (zona)
  { uf: 'ms', novo: '5002951', origem: '5002902', ateAno: 1982 }, // Chapadão do Sul ← Cassilândia (zona)
  { uf: 'ms', novo: '5003157', origem: '5000609', ateAno: 1982 }, // Coronel Sapucaia ← Amambai (zona)
  { uf: 'ms', novo: '5003488', origem: '5000708', ateAno: 1982 }, // Dois Irmãos do Buriti ← Anastácio (zona)
  { uf: 'ms', novo: '5005152', origem: '5002407', ateAno: 1982 }, // Juti ← Caarapó (zona)
  { uf: 'ms', novo: '5006358', origem: '5007703', ateAno: 1982 }, // Paranhos ← Sete Quedas (zona)
  { uf: 'ms', novo: '5007554', origem: '5002308', ateAno: 1982 }, // Santa Rita do Pardo ← Brasilândia (zona)
  { uf: 'ms', novo: '5007935', origem: '5006408', ateAno: 1982 }, // Sonora ← Pedro Gomes (zona)
  { uf: 'ms', novo: '5008404', origem: '5003801', ateAno: 1982 }, // Vicentina ← Fátima do Sul (zona)
  { uf: 'mt', novo: '5100607', origem: '5100300', ateAno: 1982 }, // Alto Taquari ← Alto Araguaia (zona)
  { uf: 'mt', novo: '5100805', origem: '5100250', ateAno: 1982 }, // Apiacás ← Alta Floresta (amc+zona)
  { uf: 'mt', novo: '5101001', origem: '5101803', ateAno: 1982 }, // Araguaiana ← Barra do Garças (zona)
  { uf: 'mt', novo: '5101902', origem: '5105150', ateAno: 1982 }, // Brasnorte ← Juína (zona)
  { uf: 'mt', novo: '5102603', origem: '5106257', ateAno: 1982 }, // Campinápolis ← Nova Xavantina (zona)
  { uf: 'mt', novo: '5102637', origem: '5107305', ateAno: 1982 }, // Campo Novo do Parecis ← São José do Rio Claro (amc)
  { uf: 'mt', novo: '5102678', origem: '5103601', ateAno: 1982 }, // Campo Verde ← Dom Aquino (zona)
  { uf: 'mt', novo: '5102850', origem: '5105150', ateAno: 1982 }, // Castanheira ← Juína (zona)
  { uf: 'mt', novo: '5103056', origem: '5107909', ateAno: 1982 }, // Cláudia ← Sinop (amc)
  { uf: 'mt', novo: '5103106', origem: '5102702', ateAno: 1982 }, // Cocalinho ← Canarana (fronteira)
  { uf: 'mt', novo: '5103304', origem: '5105507', ateAno: 1982 }, // Comodoro ← Vila Bela da Santíssima Trindade (zona)
  { uf: 'mt', novo: '5103809', origem: '5105002', ateAno: 1982 }, // Figueirópolis D'oeste ← Jauru (zona)
  { uf: 'mt', novo: '5104104', origem: '5107909', ateAno: 1982 }, // Guarantã do Norte ← Sinop (via MATUPÁ)
  { uf: 'mt', novo: '5104500', origem: '5101258', ateAno: 1982 }, // Indiavaí ← Araputanga (zona)
  { uf: 'mt', novo: '5104559', origem: '5103205', ateAno: 1982 }, // Itaúba ← Colíder (zona)
  { uf: 'mt', novo: '5104906', origem: '5107701', ateAno: 1982 }, // Jangada ← Rosário Oeste (zona)
  { uf: 'mt', novo: '5105176', origem: '5101407', ateAno: 1982 }, // Juruena ← Aripuanã (zona)
  { uf: 'mt', novo: '5105259', origem: '5103502', ateAno: 1982 }, // Lucas do Rio Verde ← Diamantino (via NOVA MUTUM)
  { uf: 'mt', novo: '5105580', origem: '5107909', ateAno: 1982 }, // Marcelândia ← Sinop (amc)
  { uf: 'mt', novo: '5105606', origem: '5107909', ateAno: 1982 }, // Matupá ← Sinop (via PEIXOTO DE AZEVEDO)
  { uf: 'mt', novo: '5106216', origem: '5100250', ateAno: 1982 }, // Nova Canaã do Norte ← Alta Floresta (amc+fronteira)
  { uf: 'mt', novo: '5106224', origem: '5103502', ateAno: 1982 }, // Nova Mutum ← Diamantino (zona)
  { uf: 'mt', novo: '5106232', origem: '5101704', ateAno: 1982 }, // Nova Olímpia ← Barra do Bugres (zona)
  { uf: 'mt', novo: '5106273', origem: '5106802', ateAno: 1982 }, // Novo Horizonte do Norte ← Porto dos Gaúchos (zona)
  { uf: 'mt', novo: '5106281', origem: '5103908', ateAno: 1982 }, // Novo São Joaquim ← General Carneiro (zona)
  { uf: 'mt', novo: '5106299', origem: '5100250', ateAno: 1982 }, // Paranaíta ← Alta Floresta (zona)
  { uf: 'mt', novo: '5106422', origem: '5107909', ateAno: 1982 }, // Peixoto de Azevedo ← Sinop (via MARCELÂNDIA)
  { uf: 'mt', novo: '5106778', origem: '5105309', ateAno: 1982 }, // Porto Alegre do Norte ← Luciara (amc+zona)
  { uf: 'mt', novo: '5106828', origem: '5102504', ateAno: 1982 }, // Porto Esperidião ← Cáceres (fronteira)
  { uf: 'mt', novo: '5107040', origem: '5107008', ateAno: 1982 }, // Primavera do Leste ← Poxoréu (fronteira)
  { uf: 'mt', novo: '5107156', origem: '5101258', ateAno: 1982 }, // Reserva do Cabaçal ← Araputanga (zona)
  { uf: 'mt', novo: '5107180', origem: '5102702', ateAno: 1982 }, // Ribeirão Cascalheira ← Canarana (amc+zona)
  { uf: 'mt', novo: '5107925', origem: '5107909', ateAno: 1982 }, // Sorriso ← Sinop (fronteira)
  { uf: 'mt', novo: '5108006', origem: '5107909', ateAno: 1982 }, // Tapurah ← Sinop (via SORRISO)
  { uf: 'mt', novo: '5108055', origem: '5103205', ateAno: 1982 }, // Terra Nova do Norte ← Colíder (amc)
  { uf: 'mt', novo: '5108501', origem: '5107909', ateAno: 1982 }, // Vera ← Sinop (zona)
  { uf: 'mt', novo: '5108600', origem: '5107776', ateAno: 1982 }, // Vila Rica ← Santa Terezinha (zona)
  { uf: 'pa', novo: '1501576', origem: '1507508', ateAno: 1982 }, // Bom Jesus do Tocantins ← São João do Araguaia (zona)
  { uf: 'pa', novo: '1501758', origem: '1507508', ateAno: 1982 }, // Brejo Grande do Araguaia ← São João do Araguaia (zona)
  { uf: 'pa', novo: '1502756', origem: '1501907', ateAno: 1982 }, // Concórdia do Pará ← Bujaru (zona)
  { uf: 'pa', novo: '1502772', origem: '1504208', ateAno: 1982 }, // Curionópolis ← Marabá (fronteira)
  { uf: 'pa', novo: '1502939', origem: '1505502', ateAno: 1982 }, // Dom Eliseu ← Paragominas (fronteira)
  { uf: 'pa', novo: '1503077', origem: '1502301', ateAno: 1982 }, // Garrafão do Norte ← Capitão Poço (fronteira)
  { uf: 'pa', novo: '1504059', origem: '1503507', ateAno: 1982 }, // Mãe do Rio ← Irituia (fronteira)
  { uf: 'pa', novo: '1504455', origem: '1505908', ateAno: 1982 }, // Medicilândia ← Porto de Moz (amc+fronteira)
  { uf: 'pa', novo: '1505437', origem: '1507300', ateAno: 1982 }, // Ourilândia do Norte ← São Félix do Xingu (fronteira)
  { uf: 'pa', novo: '1505486', origem: '1508100', ateAno: 1982 }, // Pacajá ← Tucuruí (amc+fronteira)
  { uf: 'pa', novo: '1505536', origem: '1504208', ateAno: 1982 }, // Parauapebas ← Marabá (fronteira)
  { uf: 'pa', novo: '1506195', origem: '1501006', ateAno: 1982 }, // Rurópolis ← Aveiro (zona)
  { uf: 'pa', novo: '1506583', origem: '1506708', ateAno: 1982 }, // Santa Maria das Barreiras ← Santana do Araguaia (zona)
  { uf: 'pa', novo: '1507458', origem: '1504208', ateAno: 1982 }, // São Geraldo do Araguaia ← Marabá (fronteira)
  { uf: 'pa', novo: '1507474', origem: '1506104', ateAno: 1982 }, // São João de Pirabas ← Primavera (zona)
  { uf: 'pa', novo: '1507953', origem: '1504703', ateAno: 1982 }, // Tailândia ← Moju (zona)
  { uf: 'pa', novo: '1508084', origem: '1507300', ateAno: 1982 }, // Tucumã ← São Félix do Xingu (fronteira)
  { uf: 'pa', novo: '1508159', origem: '1500602', ateAno: 1982 }, // Uruará ← Altamira (fronteira)
  { uf: 'pb', novo: '2503704', origem: '2502201', ateAno: 1982 }, // Cajazeiras ← Bom Jesus (zona)
  { uf: 'pb', novo: '2503803', origem: '2506400', ateAno: 1982 }, // Caldas Brandão ← Gurinhém (zona)
  { uf: 'pi', novo: '2200251', origem: '2208205', ateAno: 1982 }, // Alagoinha do Piauí ← Pio Ix (zona)
  { uf: 'pi', novo: '2203453', origem: '2210003', ateAno: 1982 }, // Dom Inocêncio ← São João do Piauí (fronteira)
  { uf: 'pi', novo: '2209856', origem: '2201804', ateAno: 1982 }, // São João da Canabrava ← Bocaina (zona)
  { uf: 'pr', novo: '4104055', origem: '4109302', ateAno: 1982 }, // Campo Bonito ← Guaraniaçu (zona)
  { uf: 'pr', novo: '4106555', origem: '4102505', ateAno: 1982 }, // Corumbataí do Sul ← Barbosa Ferraz (zona)
  { uf: 'pr', novo: '4107157', origem: '4128559', ateAno: 1982 }, // Diamante D'oeste ← Vera Cruz do Oeste (zona)
  { uf: 'pr', novo: '4113734', origem: '4104303', ateAno: 1982 }, // Luiziana ← Campo Mourão (zona)
  { uf: 'pr', novo: '4117271', origem: '4119608', ateAno: 1982 }, // Nova Tebas ← Pitanga (zona)
  { uf: 'pr', novo: '4122651', origem: '4108700', ateAno: 1982 }, // Rosário do Ivaí ← Grandes Rios (zona)
  { uf: 'pr', novo: '4124053', origem: '4108304', ateAno: 1982 }, // Santa Terezinha de Itaipu ← Foz do Iguaçu (zona)
  { uf: 'pr', novo: '4125456', origem: '4123501', ateAno: 1982 }, // São José das Palmeiras ← Santa Helena (zona)
  { uf: 'pr', novo: '4126652', origem: '4124806', ateAno: 1982 }, // Sulina ← São João (zona)
  { uf: 'rj', novo: '3300258', origem: '3300704', ateAno: 1982 }, // Arraial do Cabo ← Cabo Frio (zona)
  { uf: 'rj', novo: '3302056', origem: '3302205', ateAno: 1982 }, // Italva ← Itaperuna (fronteira)
  { uf: 'rj', novo: '3302254', origem: '3304201', ateAno: 1982 }, // Itatiaia ← Resende (zona)
  { uf: 'rj', novo: '3303856', origem: '3302908', ateAno: 1982 }, // Paty do Alferes ← Miguel Pereira (zona)
  { uf: 'rj', novo: '3305158', origem: '3303906', ateAno: 1982 }, // São José do Vale do Rio Preto ← Petrópolis (zona)
  { uf: 'rn', novo: '2413359', origem: '2402501', ateAno: 1982 }, // Serra do Mel ← Carnaubais (zona)
  { uf: 'rs', novo: '4300059', origem: '4320909', ateAno: 1982 }, // Água Santa ← Tapejara (zona)
  { uf: 'rs', novo: '4300455', origem: '4310405', ateAno: 1982 }, // Alegria ← Independência (zona)
  { uf: 'rs', novo: '4300554', origem: '4307500', ateAno: 1982 }, // Alto Alegre ← Espumoso (zona)
  { uf: 'rs', novo: '4300638', origem: '4306502', ateAno: 1982 }, // Amaral Ferrador ← Dom Feliciano (zona)
  { uf: 'rs', novo: '4300661', origem: '4313300', ateAno: 1982 }, // André da Rocha ← Nova Prata (zona)
  { uf: 'rs', novo: '4301057', origem: '4321501', ateAno: 1982 }, // Arroio do Sal ← Torres (zona)
  { uf: 'rs', novo: '4301552', origem: '4308706', ateAno: 1982 }, // Áurea ← Gaurama (zona)
  { uf: 'rs', novo: '4301651', origem: '4304804', ateAno: 1982 }, // Barão ← Carlos Barbosa (zona)
  { uf: 'rs', novo: '4302451', origem: '4322608', ateAno: 1982 }, // Boqueirão do Leão ← Venâncio Aires (zona)
  { uf: 'rs', novo: '4302659', origem: '4312401', ateAno: 1982 }, // Brochier ← Montenegro (zona)
  { uf: 'rs', novo: '4303558', origem: '4311809', ateAno: 1982 }, // Camargo ← Marau (zona)
  { uf: 'rs', novo: '4304101', origem: '4307500', ateAno: 1982 }, // Campos Borges ← Espumoso (zona)
  { uf: 'rs', novo: '4304689', origem: '4319505', ateAno: 1982 }, // Capela de Santana ← São Sebastião do Caí (zona)
  { uf: 'rs', novo: '4304952', origem: '4309902', ateAno: 1982 }, // Caseiros ← Ibiraiaras (zona)
  { uf: 'rs', novo: '4305132', origem: '4304200', ateAno: 1982 }, // Cerro Branco ← Candelária (fronteira)
  { uf: 'rs', novo: '4305157', origem: '4311601', ateAno: 1982 }, // Cerro Grande ← Liberato Salzano (fronteira)
  { uf: 'rs', novo: '4305173', origem: '4303509', ateAno: 1982 }, // Cerro Grande do Sul ← Camaquã (fronteira)
  { uf: 'rs', novo: '4305454', origem: '4321600', ateAno: 1982 }, // Cidreira ← Tramandaí (zona)
  { uf: 'rs', novo: '4306056', origem: '4303509', ateAno: 1982 }, // Cristal ← Camaquã (zona)
  { uf: 'rs', novo: '4306353', origem: '4318903', ateAno: 1982 }, // Dezesseis de Novembro ← São Luiz Gonzaga (zona)
  { uf: 'rs', novo: '4306452', origem: '4300703', ateAno: 1982 }, // Dois Lajeados ← Anta Gorda (zona)
  { uf: 'rs', novo: '4306734', origem: '4309605', ateAno: 1982 }, // Doutor Maurício Cardoso ← Horizontina (zona)
  { uf: 'rs', novo: '4306767', origem: '4309308', ateAno: 1982 }, // Eldorado do Sul ← Guaíba (zona)
  { uf: 'rs', novo: '4306932', origem: '4317509', ateAno: 1982 }, // Entre-ijuís ← Santo Ângelo (zona)
  { uf: 'rs', novo: '4306957', origem: '4319703', ateAno: 1982 }, // Entre Rios do Sul ← São Valentim (zona)
  { uf: 'rs', novo: '4306973', origem: '4308904', ateAno: 1982 }, // Erebango ← Getúlio Vargas (zona)
  { uf: 'rs', novo: '4307054', origem: '4314100', ateAno: 1982 }, // Ernestina ← Passo Fundo (zona)
  { uf: 'rs', novo: '4307559', origem: '4320503', ateAno: 1982 }, // Estação ← Sertão (zona)
  { uf: 'rs', novo: '4307831', origem: '4311155', ateAno: 1982 }, // Eugênio de Castro ← Jóia (fronteira)
  { uf: 'rs', novo: '4307864', origem: '4322806', ateAno: 1982 }, // Fagundes Varela ← Veranópolis (zona)
  { uf: 'rs', novo: '4308052', origem: '4307203', ateAno: 1982 }, // Faxinalzinho ← Erval Grande (zona)
  { uf: 'rs', novo: '4309050', origem: '4309209', ateAno: 1982 }, // Glorinha ← Gravataí (zona)
  { uf: 'rs', novo: '4309258', origem: '4313300', ateAno: 1982 }, // Guabiju ← Nova Prata (zona)
  { uf: 'rs', novo: '4309555', origem: '4319505', ateAno: 1982 }, // Harmonia ← São Sebastião do Caí (zona)
  { uf: 'rs', novo: '4309753', origem: '4320701', ateAno: 1982 }, // Ibarama ← Sobradinho (zona)
  { uf: 'rs', novo: '4309951', origem: '4320800', ateAno: 1982 }, // Ibirapuitã ← Soledade (zona)
  { uf: 'rs', novo: '4310330', origem: '4321600', ateAno: 1982 }, // Imbé ← Tramandaí (zona)
  { uf: 'rs', novo: '4310363', origem: '4321451', ateAno: 1982 }, // Imigrante ← Teutônia (zona)
  { uf: 'rs', novo: '4310439', origem: '4300802', ateAno: 1982 }, // Ipê ← Antônio Prado (zona)
  { uf: 'rs', novo: '4310462', origem: '4320503', ateAno: 1982 }, // Ipiranga do Sul ← Sertão (zona)
  { uf: 'rs', novo: '4310553', origem: '4317400', ateAno: 1982 }, // Itacurubi ← Santiago (zona)
  { uf: 'rs', novo: '4310751', origem: '4308003', ateAno: 1982 }, // Ivorá ← Faxinal do Soturno (zona)
  { uf: 'rs', novo: '4310850', origem: '4313706', ateAno: 1982 }, // Jaboticaba ← Palmeira das Missões (amc)
  { uf: 'rs', novo: '4311122', origem: '4302303', ateAno: 1982 }, // Jaquirana ← Bom Jesus (zona)
  { uf: 'rs', novo: '4311254', origem: '4302006', ateAno: 1982 }, // Lagoão ← Barros Cassal (zona)
  { uf: 'rs', novo: '4312351', origem: '4320404', ateAno: 1982 }, // Montauri ← Serafina Corrêa (zona)
  { uf: 'rs', novo: '4312450', origem: '4314407', ateAno: 1982 }, // Morro Redondo ← Pelotas (zona)
  { uf: 'rs', novo: '4312757', origem: '4320800', ateAno: 1982 }, // Nova Alvorada ← Soledade (fronteira)
  { uf: 'rs', novo: '4313037', origem: '4311106', ateAno: 1982 }, // Nova Esperança do Sul ← Jaguari (zona)
  { uf: 'rs', novo: '4313060', origem: '4319901', ateAno: 1982 }, // Nova Hartz ← Sapiranga (zona)
  { uf: 'rs', novo: '4313359', origem: '4300802', ateAno: 1982 }, // Nova Roma do Sul ← Antônio Prado (zona)
  { uf: 'rs', novo: '4313953', origem: '4315701', ateAno: 1982 }, // Pantano Grande ← Rio Pardo (zona)
  { uf: 'rs', novo: '4314027', origem: '4303004', ateAno: 1982 }, // Paraíso do Sul ← Cachoeira do Sul (zona)
  { uf: 'rs', novo: '4314159', origem: '4321303', ateAno: 1982 }, // Paverama ← Taquari (zona)
  { uf: 'rs', novo: '4314456', origem: '4320206', ateAno: 1982 }, // Pinhal ← Seberi (fronteira)
  { uf: 'rs', novo: '4314555', origem: '4319208', ateAno: 1982 }, // Pirapó ← São Nicolau (zona)
  { uf: 'rs', novo: '4314753', origem: '4321451', ateAno: 1982 }, // Poço das Antas ← Teutônia (zona)
  { uf: 'rs', novo: '4315131', origem: '4315206', ateAno: 1982 }, // Pouso Novo ← Putinga (fronteira)
  { uf: 'rs', novo: '4315156', origem: '4302006', ateAno: 1982 }, // Progresso ← Barros Cassal (fronteira)
  { uf: 'rs', novo: '4315172', origem: '4313300', ateAno: 1982 }, // Protásio Alves ← Nova Prata (zona)
  { uf: 'rs', novo: '4315354', origem: '4310009', ateAno: 1982 }, // Quinze de Novembro ← Ibirubá (zona)
  { uf: 'rs', novo: '4315453', origem: '4306809', ateAno: 1982 }, // Relvado ← Encantado (zona)
  { uf: 'rs', novo: '4315750', origem: '4316006', ateAno: 1982 }, // Riozinho ← Rolante (zona)
  { uf: 'rs', novo: '4316436', origem: '4316709', ateAno: 1982 }, // Saldanha Marinho ← Santa Bárbara do Sul (zona)
  { uf: 'rs', novo: '4316956', origem: '4309100', ateAno: 1982 }, // Santa Maria do Herval ← Gramado (fronteira)
  { uf: 'rs', novo: '4318051', origem: '4314001', ateAno: 1982 }, // São Domingos do Sul ← Paraí (zona)
  { uf: 'rs', novo: '4318424', origem: '4316600', ateAno: 1982 }, // São João da Urtiga ← Sananduva (zona)
  { uf: 'rs', novo: '4318440', origem: '4309902', ateAno: 1982 }, // São Jorge ← Ibiraiaras (fronteira)
  { uf: 'rs', novo: '4318465', origem: '4308300', ateAno: 1982 }, // São José do Herval ← Fontoura Xavier (zona)
  { uf: 'rs', novo: '4318481', origem: '4314803', ateAno: 1982 }, // São José do Hortêncio ← Portão (zona)
  { uf: 'rs', novo: '4319158', origem: '4311155', ateAno: 1982 }, // São Miguel das Missões ← Jóia (fronteira)
  { uf: 'rs', novo: '4319752', origem: '4302352', ateAno: 1982 }, // São Vendelino ← Bom Princípio (fronteira)
  { uf: 'rs', novo: '4320230', origem: '4304002', ateAno: 1982 }, // Sede Nova ← Campo Novo (zona)
  { uf: 'rs', novo: '4320263', origem: '4320701', ateAno: 1982 }, // Segredo ← Sobradinho (zona)
  { uf: 'rs', novo: '4320651', origem: '4316907', ateAno: 1982 }, // Silveira Martins ← Santa Maria (zona)
  { uf: 'rs', novo: '4321329', origem: '4308508', ateAno: 1982 }, // Taquaruçu do Sul ← Frederico Westphalen (zona)
  { uf: 'rs', novo: '4321436', origem: '4304630', ateAno: 1982 }, // Terra de Areia ← Capão da Canoa (fronteira)
  { uf: 'rs', novo: '4321634', origem: '4300901', ateAno: 1982 }, // Três Arroios ← Aratiba (zona)
  { uf: 'rs', novo: '4321667', origem: '4304630', ateAno: 1982 }, // Três Cachoeiras ← Capão da Canoa (via TERRA DE AREIA)
  { uf: 'rs', novo: '4321857', origem: '4316105', ateAno: 1982 }, // Três Palmeiras ← Ronda Alta (zona)
  { uf: 'rs', novo: '4321956', origem: '4312708', ateAno: 1982 }, // Trindade do Sul ← Nonoai (zona)
  { uf: 'rs', novo: '4322152', origem: '4301206', ateAno: 1982 }, // Tunas ← Arroio do Tigre (zona)
  { uf: 'rs', novo: '4322251', origem: '4302352', ateAno: 1982 }, // Tupandi ← Bom Princípio (zona)
  { uf: 'rs', novo: '4322558', origem: '4306304', ateAno: 1982 }, // Vanini ← David Canabarro (zona)
  { uf: 'rs', novo: '4323309', origem: '4322806', ateAno: 1982 }, // Vila Flores ← Veranópolis (zona)
  { uf: 'rs', novo: '4323408', origem: '4311809', ateAno: 1982 }, // Vila Maria ← Marau (zona)
  { uf: 'rs', novo: '4323507', origem: '4313805', ateAno: 1982 }, // Vista Alegre ← Palmitinho (zona)
  { uf: 'rs', novo: '4323606', origem: '4312906', ateAno: 1982 }, // Vista Alegre do Prata ← Nova Bassano (zona)
  { uf: 'rs', novo: '4323705', origem: '4321402', ateAno: 1982 }, // Vista Gaúcha ← Tenente Portela (zona)
  { uf: 'sc', novo: '4200051', origem: '4203600', ateAno: 1982 }, // Abdon Batista ← Campos Novos (zona)
  { uf: 'sc', novo: '4201257', origem: '4207502', ateAno: 1982 }, // Apiúna ← Indaial (zona)
  { uf: 'sc', novo: '4204152', origem: '4201000', ateAno: 1982 }, // Celso Ramos ← Anita Garibaldi (zona)
  { uf: 'sc', novo: '4205159', origem: '4202206', ateAno: 1982 }, // Doutor Pedrinho ← Benedito Novo (zona)
  { uf: 'sc', novo: '4205456', origem: '4204608', ateAno: 1982 }, // Forquilhinha ← Criciúma (zona)
  { uf: 'sc', novo: '4207650', origem: '4211009', ateAno: 1982 }, // Iporã do Oeste ← Mondaí (zona)
  { uf: 'sc', novo: '4207759', origem: '4204707', ateAno: 1982 }, // Iraceminha ← Cunha Porã (zona)
  { uf: 'sc', novo: '4208450', origem: '4205803', ateAno: 1982 }, // Itapoá ← Garuva (zona)
  { uf: 'sc', novo: '4209151', origem: '4206900', ateAno: 1982 }, // José Boiteux ← Ibirama (zona)
  { uf: 'sc', novo: '4209854', origem: '4207700', ateAno: 1982 }, // Lindóia do Sul ← Ipumirim (zona)
  { uf: 'sc', novo: '4210555', origem: '4200101', ateAno: 1982 }, // Marema ← Abelardo Luz (amc+fronteira)
  { uf: 'sc', novo: '4215653', origem: '4217709', ateAno: 1982 }, // Santa Rosa do Sul ← Sombrio (zona)
  { uf: 'sc', novo: '4217550', origem: '4210902', ateAno: 1982 }, // Serra Alta ← Modelo (zona)
  { uf: 'sc', novo: '4218251', origem: '4215505', ateAno: 1982 }, // Timbó Grande ← Santa Cecília (zona)
  { uf: 'sc', novo: '4218756', origem: '4208401', ateAno: 1982 }, // Tunápolis ← Itapiranga (zona)
  { uf: 'sc', novo: '4218855', origem: '4204400', ateAno: 1982 }, // União do Oeste ← Coronel Freitas (amc)
  { uf: 'sc', novo: '4218954', origem: '4216503', ateAno: 1982 }, // Urupema ← São Joaquim (zona)
  { uf: 'sc', novo: '4219358', origem: '4219408', ateAno: 1982 }, // Vitor Meireles ← Witmarsum (zona)
  { uf: 'sp', novo: '3509304', origem: '3533908', ateAno: 1982 }, // Cajobi ← Olímpia (zona)
  { uf: 'to', novo: '1700350', origem: '1709500', ateAno: 1982 }, // Aliança do Tocantins ← Gurupi (zona)
  { uf: 'to', novo: '1701101', origem: '1715101', ateAno: 1982 }, // Aparecida do Rio Negro ← Novo Acordo (zona)
  { uf: 'to', novo: '1703107', origem: '1707207', ateAno: 1982 }, // Barrolândia ← Dois Irmãos do Tocantins (zona)
  { uf: 'to', novo: '1703206', origem: '1702307', ateAno: 1982 }, // Bernardo Sayão ← Arapoema (fronteira)
  { uf: 'to', novo: '1703800', origem: '1702208', ateAno: 1982 }, // Buriti do Tocantins ← Araguatins (zona)
  { uf: 'to', novo: '1703909', origem: '1701903', ateAno: 1982 }, // Caseara ← Araguacema (zona)
  { uf: 'to', novo: '1705557', origem: '1702406', ateAno: 1982 }, // Combinado ← Arraias (zona)
  { uf: 'to', novo: '1707108', origem: '1717503', ateAno: 1982 }, // Divinópolis do Tocantins ← Pium (via MARIANÓPOLIS DO TOCANTINS)
  { uf: 'to', novo: '1708304', origem: '1716703', ateAno: 1982 }, // Goianorte ← Colméia (zona)
  { uf: 'to', novo: '1712504', origem: '1717503', ateAno: 1982 }, // Marianópolis do Tocantins ← Pium (fronteira)
  { uf: 'to', novo: '1715002', origem: '1706100', ateAno: 1982 }, // Nova Rosalândia ← Cristalândia (zona)
  { uf: 'to', novo: '1715754', origem: '1702406', ateAno: 1982 }, // Palmeirópolis ← Arraias (via PARANÃ)
  { uf: 'to', novo: '1716208', origem: '1702406', ateAno: 1982 }, // Paranã ← Arraias (fronteira)
  { uf: 'to', novo: '1716653', origem: '1706001', ateAno: 1982 }, // Pequizeiro ← Couto Magalhães (zona)
  { uf: 'to', novo: '1718006', origem: '1707009', ateAno: 1982 }, // Porto Alegre do Tocantins ← Dianópolis (zona)
  { uf: 'to', novo: '1718303', origem: '1720309', ateAno: 1982 }, // Praia Norte ← São Sebastião do Tocantins (amc+zona)
  { uf: 'to', novo: '1718808', origem: '1702554', ateAno: 1982 }, // Sampaio ← Augustinópolis (zona)
  { uf: 'to', novo: '1718907', origem: '1720655', ateAno: 1982 }, // Santa Rosa do Tocantins ← Silvanópolis (fronteira)
  { uf: 'to', novo: '1719004', origem: '1715101', ateAno: 1982 }, // Santa Tereza do Tocantins ← Novo Acordo (amc)
  { uf: 'to', novo: '1720499', origem: '1716604', ateAno: 1982 }, // São Valério ← Peixe (zona)
  { uf: 'to', novo: '1721000', origem: '1721109', ateAno: 1982 }, // Palmas ← Tocantínia (amc)
  // criados até 1982 (já votavam sozinhos em 1982): em 1978 ainda votavam na origem
  { uf: 'sp', novo: '3556453', origem: '3513009', ateAno: 1978 }, // Vargem Grande Paulista ← Cotia
  // instalados em 1993 (primeira eleição municipal em 1992): em 1989 ainda votavam na origem. Origem pelo grupo de
  // Áreas Mínimas Comparáveis 1991–2000; com mais de uma origem no grupo, a da zona eleitoral de 1998 ou a de maior
  // fronteira (scripts/propor-fusoes.mjs --ano 1989 --depois 1998 --amc); revisados à mão os marcados
  { uf: 'ac', novo: '1200013', origem: '1200450', ateAno: 1992 }, // Acrelândia ← Senador Guiomard
  { uf: 'ac', novo: '1200138', origem: '1200401', ateAno: 1992 }, // Bujari ← Rio Branco
  { uf: 'ac', novo: '1200179', origem: '1200401', ateAno: 1992 }, // Capixaba ← Rio Branco
  { uf: 'ac', novo: '1200252', origem: '1200104', ateAno: 1992 }, // Epitaciolândia ← Brasiléia
  { uf: 'ac', novo: '1200328', origem: '1200609', ateAno: 1992 }, // Jordão ← Tarauacá
  { uf: 'ac', novo: '1200351', origem: '1200203', ateAno: 1992 }, // Marechal Thaumaturgo ← Cruzeiro do Sul
  { uf: 'ac', novo: '1200393', origem: '1200203', ateAno: 1992 }, // Porto Walter ← Cruzeiro do Sul
  { uf: 'ac', novo: '1200427', origem: '1200203', ateAno: 1992 }, // Rodrigues Alves ← Cruzeiro do Sul
  { uf: 'ac', novo: '1200435', origem: '1200344', ateAno: 1992 }, // Santa Rosa do Purus ← Manoel Urbano
  { uf: 'ac', novo: '1200807', origem: '1200401', ateAno: 1992 }, // Porto Acre ← Rio Branco
  { uf: 'al', novo: '2702553', origem: '2706307', ateAno: 1992 }, // Estrela de Alagoas ← Palmeira dos Índios
  { uf: 'al', novo: '2706422', origem: '2700102', ateAno: 1992 }, // Pariconha ← Água Branca
  { uf: 'al', novo: '2706448', origem: '2700508', ateAno: 1992 }, // Paripueira ← Barra de Santo Antônio
  { uf: 'ap', novo: '1600055', origem: '1600303', ateAno: 1992 }, // Serra do Navio ← Macapá (revisado)
  { uf: 'ap', novo: '1600154', origem: '1600303', ateAno: 1992 }, // Pedra Branca do Amapari ← Macapá (revisado)
  { uf: 'ap', novo: '1600212', origem: '1600303', ateAno: 1992 }, // Cutias ← Macapá
  { uf: 'ap', novo: '1600253', origem: '1600303', ateAno: 1992 }, // Itaubal ← Macapá
  { uf: 'ap', novo: '1600535', origem: '1600238', ateAno: 1992 }, // Porto Grande ← Ferreira Gomes
  { uf: 'ap', novo: '1600550', origem: '1600105', ateAno: 1992 }, // Pracuúba ← Amapá
  { uf: 'ce', novo: '2301257', origem: '2309300', ateAno: 1992 }, // Ararendá ← Nova Russas
  { uf: 'ce', novo: '2303659', origem: '2312205', ateAno: 1992 }, // Catunda ← Santa Quitéria
  { uf: 'ce', novo: '2303931', origem: '2311306', ateAno: 1992 }, // Choró ← Quixadá
  { uf: 'ce', novo: '2304459', origem: '2301109', ateAno: 1992 }, // Fortim ← Aracati
  { uf: 'ce', novo: '2306256', origem: '2309706', ateAno: 1992 }, // Itaitinga ← Pacatuba
  { uf: 'ce', novo: '2307254', origem: '2304251', ateAno: 1992 }, // Jijoca de Jericoacoara ← Cruz
  { uf: 'es', novo: '3202652', origem: '3203007', ateAno: 1992 }, // Irupi ← Iúna
  { uf: 'es', novo: '3203346', origem: '3201902', ateAno: 1992 }, // Marechal Floriano ← Domingos Martins
  { uf: 'es', novo: '3204658', origem: '3201506', ateAno: 1992 }, // São Domingos do Norte ← Colatina
  { uf: 'es', novo: '3205150', origem: '3203908', ateAno: 1992 }, // Vila Pavão ← Nova Venécia
  { uf: 'go', novo: '5200555', origem: '5212808', ateAno: 1992 }, // Alto Horizonte ← Mara Rosa
  { uf: 'go', novo: '5201454', origem: '5211909', ateAno: 1992 }, // Aparecida do Rio Doce ← Jataí
  { uf: 'go', novo: '5203939', origem: '5213905', ateAno: 1992 }, // Buriti de Goiás ← Mossâmedes
  { uf: 'go', novo: '5203962', origem: '5212709', ateAno: 1992 }, // Buritinópolis ← Mambaí
  { uf: 'go', novo: '5204557', origem: '5203302', ateAno: 1992 }, // Caldazinha ← Bela Vista de Goiás
  { uf: 'go', novo: '5205059', origem: '5218805', ateAno: 1992 }, // Castelândia ← Rio Verde
  { uf: 'go', novo: '5205471', origem: '5201504', ateAno: 1992 }, // Chapadão do Céu ← Aporé
  { uf: 'go', novo: '5205497', origem: '5212501', ateAno: 1992 }, // Cidade Ocidental ← Luziânia
  { uf: 'go', novo: '5205513', origem: '5205802', ateAno: 1992 }, // Cocalzinho de Goiás ← Corumbá de Goiás
  { uf: 'go', novo: '5209291', origem: '5211206', ateAno: 1992 }, // Guaraíta ← Itapuranga
  { uf: 'go', novo: '5209937', origem: '5211503', ateAno: 1992 }, // Inaciolândia ← Itumbiara
  { uf: 'go', novo: '5212055', origem: '5219902', ateAno: 1992 }, // Jesúpolis ← São Francisco de Goiás
  { uf: 'go', novo: '5213772', origem: '5221452', ateAno: 1992 }, // Montividiu do Norte ← Trombas
  { uf: 'go', novo: '5214879', origem: '5212808', ateAno: 1992 }, // Nova Iguaçu de Goiás ← Mara Rosa
  { uf: 'go', novo: '5216452', origem: '5211909', ateAno: 1992 }, // Perolândia ← Jataí
  { uf: 'go', novo: '5218391', origem: '5217104', ateAno: 1992 }, // Professor Jamil ← Piracanjuba
  { uf: 'go', novo: '5219712', origem: '5218805', ateAno: 1992 }, // Santo Antônio da Barra ← Rio Verde
  { uf: 'go', novo: '5219738', origem: '5208806', ateAno: 1992 }, // Santo Antônio de Goiás ← Goianira
  { uf: 'go', novo: '5221197', origem: '5208400', ateAno: 1992 }, // Terezópolis de Goiás ← Goianápolis
  { uf: 'go', novo: '5221577', origem: '5206404', ateAno: 1992 }, // Uirapuru ← Crixás
  { uf: 'go', novo: '5222203', origem: '5208004', ateAno: 1992 }, // Vila Boa ← Formosa
  { uf: 'mg', novo: '3101631', origem: '3154408', ateAno: 1992 }, // Alfredo Vasconcelos ← Ressaquinha
  { uf: 'mg', novo: '3103751', origem: '3169604', ateAno: 1992 }, // Araporã ← Tupaciguara
  { uf: 'mg', novo: '3112653', origem: '3133204', ateAno: 1992 }, // Capitão Andrade ← Itanhomi
  { uf: 'mg', novo: '3114550', origem: '3134400', ateAno: 1992 }, // Carneirinho ← Iturama
  { uf: 'mg', novo: '3115458', origem: '3132305', ateAno: 1992 }, // Catuji ← Itaipé
  { uf: 'mg', novo: '3122454', origem: '3101706', ateAno: 1992 }, // Divisópolis ← Almenara
  { uf: 'mg', novo: '3123528', origem: '3139508', ateAno: 1992 }, // Durandé ← Manhumirim
  { uf: 'mg', novo: '3123858', origem: '3113404', ateAno: 1992 }, // Entre Folhas ← Caratinga
  { uf: 'mg', novo: '3125952', origem: '3113305', ateAno: 1992 }, // Fervedouro ← Carangola
  { uf: 'mg', novo: '3130051', origem: '3161106', ateAno: 1992 }, // Icaraí de Minas ← São Francisco
  { uf: 'mg', novo: '3131158', origem: '3113404', ateAno: 1992 }, // Ipaba ← Caratinga
  { uf: 'mg', novo: '3135050', origem: '3139300', ateAno: 1992 }, // Jaíba ← Manga
  { uf: 'mg', novo: '3135076', origem: '3110806', ateAno: 1992 }, // Jampruca ← Campanário
  { uf: 'mg', novo: '3136652', origem: '3140704', ateAno: 1992 }, // Juatuba ← Mateus Leme
  { uf: 'mg', novo: '3137536', origem: '3153400', ateAno: 1992 }, // Lagoa Grande ← Presidente Olegário
  { uf: 'mg', novo: '3138625', origem: '3134400', ateAno: 1992 }, // Limeira do Oeste ← Iturama
  { uf: 'mg', novo: '3138658', origem: '3162401', ateAno: 1992 }, // Lontra ← São João da Ponte
  { uf: 'mg', novo: '3139250', origem: '3124302', ateAno: 1992 }, // Mamonas ← Espinosa
  { uf: 'mg', novo: '3140555', origem: '3101706', ateAno: 1992 }, // Mata Verde ← Almenara
  { uf: 'mg', novo: '3140852', origem: '3139300', ateAno: 1992 }, // Matias Cardoso ← Manga
  { uf: 'mg', novo: '3143450', origem: '3155603', ateAno: 1992 }, // Montezuma ← Rio Pardo de Minas
  { uf: 'mg', novo: '3146750', origem: '3155108', ateAno: 1992 }, // Palmópolis ← Rio do Prado
  { uf: 'mg', novo: '3149150', origem: '3135209', ateAno: 1992 }, // Pedras de Maria da Cruz ← Januária
  { uf: 'mg', novo: '3154457', origem: '3164209', ateAno: 1992 }, // Riachinho ← São Romão
  { uf: 'mg', novo: '3157252', origem: '3113404', ateAno: 1992 }, // Santa Bárbara do Leste ← Caratinga
  { uf: 'mg', novo: '3158953', origem: '3141702', ateAno: 1992 }, // Santana do Paraíso ← Mesquita
  { uf: 'mg', novo: '3159357', origem: '3113404', ateAno: 1992 }, // Santa Rita de Minas ← Caratinga
  { uf: 'mg', novo: '3162559', origem: '3139409', ateAno: 1992 }, // São João do Manhuaçu ← Manhuaçu
  { uf: 'mg', novo: '3162575', origem: '3139607', ateAno: 1992 }, // São João do Manteninha ← Mantena
  { uf: 'mg', novo: '3162955', origem: '3171204', ateAno: 1992 }, // São José da Lapa ← Vespasiano
  { uf: 'mg', novo: '3165578', origem: '3110608', ateAno: 1992 }, // Senador Amaral ← Cambuí
  { uf: 'mg', novo: '3170057', origem: '3113404', ateAno: 1992 }, // Ubaporanga ← Caratinga
  { uf: 'mg', novo: '3170529', origem: '3161106', ateAno: 1992 }, // Urucuia ← São Francisco
  { uf: 'ms', novo: '5000252', origem: '5003306', ateAno: 1992 }, // Alcinópolis ← Coxim
  { uf: 'ms', novo: '5004809', origem: '5005681', ateAno: 1992 }, // Japorã ← Mundo Novo
  { uf: 'ms', novo: '5005251', origem: '5006606', ateAno: 1992 }, // Laguna Carapã ← Ponta Porã
  { uf: 'ms', novo: '5006002', origem: '5007208', ateAno: 1992 }, // Nova Alvorada do Sul ← Rio Brilhante
  { uf: 'ms', novo: '5006259', origem: '5004700', ateAno: 1992 }, // Novo Horizonte do Sul ← Ivinhema
  { uf: 'mt', novo: '5100359', origem: '5107859', ateAno: 1992 }, // Alto Boa Vista ← São Félix do Araguaia
  { uf: 'mt', novo: '5102694', origem: '5107859', ateAno: 1992 }, // Canabrava do Norte ← São Félix do Araguaia
  { uf: 'mt', novo: '5103353', origem: '5107776', ateAno: 1992 }, // Confresa ← Santa Terezinha
  { uf: 'mt', novo: '5103379', origem: '5105176', ateAno: 1992 }, // Cotriguaçu ← Juruena
  { uf: 'mt', novo: '5103957', origem: '5105622', ateAno: 1992 }, // Glória d'Oeste ← Mirassol d'Oeste
  { uf: 'mt', novo: '5105234', origem: '5102504', ateAno: 1992 }, // Lambari d'Oeste ← Cáceres
  { uf: 'mt', novo: '5106158', origem: '5100805', ateAno: 1992 }, // Nova Bandeirantes ← Apiacás
  { uf: 'mt', novo: '5106455', origem: '5106208', ateAno: 1992 }, // Planalto da Serra ← Nova Brasilândia
  { uf: 'mt', novo: '5106653', origem: '5108204', ateAno: 1992 }, // Pontal do Araguaia ← Torixoréu
  { uf: 'mt', novo: '5106851', origem: '5101704', ateAno: 1992 }, // Porto Estrela ← Barra do Bugres
  { uf: 'mt', novo: '5107065', origem: '5102702', ateAno: 1992 }, // Querência ← Canarana
  { uf: 'mt', novo: '5107198', origem: '5106703', ateAno: 1992 }, // Ribeirãozinho ← Ponte Branca
  { uf: 'mt', novo: '5107248', origem: '5107909', ateAno: 1992 }, // Santa Carmem ← Sinop
  { uf: 'mt', novo: '5107263', origem: '5101308', ateAno: 1992 }, // Santo Afonso ← Arenápolis
  { uf: 'mt', novo: '5107297', origem: '5107602', ateAno: 1992 }, // São José do Povo ← Rondonópolis
  { uf: 'mt', novo: '5107354', origem: '5107859', ateAno: 1992 }, // São José do Xingu ← São Félix do Araguaia
  { uf: 'mt', novo: '5107404', origem: '5104807', ateAno: 1992 }, // São Pedro da Cipa ← Jaciara
  { uf: 'mt', novo: '5107941', origem: '5106802', ateAno: 1992 }, // Tabaporã ← Porto dos Gaúchos
  { uf: 'mt', novo: '5108808', origem: '5103205', ateAno: 1992 }, // Nova Guarita ← Colíder
  { uf: 'mt', novo: '5108857', origem: '5101308', ateAno: 1992 }, // Nova Marilândia ← Arenápolis
  { uf: 'mt', novo: '5108907', origem: '5107305', ateAno: 1992 }, // Nova Maringá ← São José do Rio Claro
  { uf: 'mt', novo: '5108956', origem: '5100805', ateAno: 1992 }, // Nova Monte Verde ← Apiacás
  { uf: 'pa', novo: '1500131', origem: '1501576', ateAno: 1992 }, // Abel Figueiredo ← Bom Jesus do Tocantins
  { uf: 'pa', novo: '1500347', origem: '1505536', ateAno: 1992 }, // Água Azul do Norte ← Parauapebas
  { uf: 'pa', novo: '1500958', origem: '1507201', ateAno: 1992 }, // Aurora do Pará ← São Domingos do Capim
  { uf: 'pa', novo: '1501725', origem: '1500602', ateAno: 1992 }, // Brasil Novo ← Altamira
  { uf: 'pa', novo: '1501782', origem: '1508100', ateAno: 1992 }, // Breu Branco ← Tucuruí
  { uf: 'pa', novo: '1502764', origem: '1505437', ateAno: 1992 }, // Cumaru do Norte ← Ourilândia do Norte
  // Cajazeirinhas, Santa Tereza do Oeste e Cajati têm votos próprios na planilha de 1982 (desdeAno 1983)
  // em 1994 o TSE pôs Ourilândia e Bannach no código de Cumaru (acima, desdeAno); em 1989 Ourilândia tinha resultado próprio
  { uf: 'pa', novo: '1501253', origem: '1505437', ateAno: 1992 }, // Bannach ← Ourilândia do Norte (revisado)
  { uf: 'pa', novo: '1502954', origem: '1502772', ateAno: 1992 }, // Eldorado dos Carajás ← Curionópolis
  { uf: 'pa', novo: '1503044', origem: '1502707', ateAno: 1992 }, // Floresta do Araguaia ← Conceição do Araguaia
  { uf: 'pa', novo: '1503093', origem: '1503804', ateAno: 1992 }, // Goianésia do Pará ← Jacundá
  { uf: 'pa', novo: '1503457', origem: '1507201', ateAno: 1992 }, // Ipixuna do Pará ← São Domingos do Capim
  { uf: 'pa', novo: '1503754', origem: '1503606', ateAno: 1992 }, // Jacareacanga ← Itaituba
  { uf: 'pa', novo: '1504950', origem: '1508308', ateAno: 1992 }, // Nova Esperança do Piriá ← Viseu
  { uf: 'pa', novo: '1504976', origem: '1503705', ateAno: 1992 }, // Nova Ipixuna ← Itupiranga
  { uf: 'pa', novo: '1505031', origem: '1503606', ateAno: 1992 }, // Novo Progresso ← Itaituba
  { uf: 'pa', novo: '1505064', origem: '1505486', ateAno: 1992 }, // Novo Repartimento ← Pacajá
  { uf: 'pa', novo: '1505494', origem: '1501758', ateAno: 1992 }, // Palestina do Pará ← Brejo Grande do Araguaia
  { uf: 'pa', novo: '1505551', origem: '1506138', ateAno: 1992 }, // Pau d'Arco ← Redenção
  { uf: 'pa', novo: '1505650', origem: '1506807', ateAno: 1992 }, // Placas ← Santarém
  { uf: 'pa', novo: '1506351', origem: '1501501', ateAno: 1992 }, // Santa Bárbara do Pará ← Benevides
  { uf: 'pa', novo: '1506559', origem: '1505403', ateAno: 1992 }, // Santa Luzia do Pará ← Ourém
  { uf: 'pa', novo: '1507151', origem: '1507508', ateAno: 1992 }, // São Domingos do Araguaia ← São João do Araguaia
  { uf: 'pa', novo: '1507961', origem: '1502905', ateAno: 1992 }, // Terra Alta ← Curuçá
  { uf: 'pa', novo: '1507979', origem: '1503002', ateAno: 1992 }, // Terra Santa ← Faro
  { uf: 'pa', novo: '1508050', origem: '1503606', ateAno: 1992 }, // Trairão ← Itaituba
  { uf: 'pa', novo: '1508126', origem: '1505502', ateAno: 1992 }, // Ulianópolis ← Paragominas
  { uf: 'pa', novo: '1508357', origem: '1500602', ateAno: 1992 }, // Vitória do Xingu ← Altamira
  { uf: 'pe', novo: '2603926', origem: '2605707', ateAno: 1992 }, // Carnaubeira da Penha ← Floresta
  { uf: 'pe', novo: '2605152', origem: '2611101', ateAno: 1992 }, // Dormentes ← Petrolina
  { uf: 'pe', novo: '2608255', origem: '2608305', ateAno: 1992 }, // Jucati ← Jupi
  { uf: 'pe', novo: '2608453', origem: '2604007', ateAno: 1992 }, // Lagoa do Carro ← Carpina
  { uf: 'pe', novo: '2611533', origem: '2603900', ateAno: 1992 }, // Quixaba ← Carnaíba
  { uf: 'pe', novo: '2612455', origem: '2609907', ateAno: 1992 }, // Santa Cruz ← Ouricuri
  { uf: 'pe', novo: '2612471', origem: '2615706', ateAno: 1992 }, // Santa Cruz da Baixa Verde ← Triunfo
  { uf: 'pe', novo: '2616183', origem: '2614501', ateAno: 1992 }, // Vertente do Lério ← Surubim
  { uf: 'pe', novo: '2616506', origem: '2600401', ateAno: 1992 }, // Xexéu ← Água Preta
  { uf: 'pi', novo: '2200277', origem: '2210300', ateAno: 1992 }, // Alegrete do Piauí ← São Julião
  { uf: 'pi', novo: '2200459', origem: '2203107', ateAno: 1992 }, // Alvorada do Gurguéia ← Cristino Castro
  { uf: 'pi', novo: '2201051', origem: '2210409', ateAno: 1992 }, // Assunção do Piauí ← São Miguel do Tapuio
  { uf: 'pi', novo: '2201150', origem: '2208908', ateAno: 1992 }, // Baixa Grande do Ribeiro ← Ribeiro Gonçalves
  { uf: 'pi', novo: '2201176', origem: '2211407', ateAno: 1992 }, // Barra d'Alcântara ← Várzea Grande
  { uf: 'pi', novo: '2201556', origem: '2210805', ateAno: 1992 }, // Bela Vista do Piauí ← Simplício Mendes
  { uf: 'pi', novo: '2201739', origem: '2207801', ateAno: 1992 }, // Betânia do Piauí ← Paulistana
  { uf: 'pi', novo: '2201770', origem: '2201200', ateAno: 1992 }, // Boa Hora ← Barras
  { uf: 'pi', novo: '2201919', origem: '2207702', ateAno: 1992 }, // Bom Princípio do Piauí ← Parnaíba
  { uf: 'pi', novo: '2201929', origem: '2200707', ateAno: 1992 }, // Bonfim do Piauí ← Anísio de Abreu
  { uf: 'pi', novo: '2201945', origem: '2202208', ateAno: 1992 }, // Boqueirão do Piauí ← Campo Maior
  { uf: 'pi', novo: '2201960', origem: '2208403', ateAno: 1992 }, // Brasileira ← Piripiri
  { uf: 'pi', novo: '2201988', origem: '2202307', ateAno: 1992 }, // Brejo do Piauí ← Canto do Buriti
  { uf: 'pi', novo: '2202026', origem: '2202604', ateAno: 1992 }, // Buriti dos Montes ← Castelo do Piauí
  { uf: 'pi', novo: '2202059', origem: '2201200', ateAno: 1992 }, // Cabeceiras do Piauí ← Barras
  { uf: 'pi', novo: '2202091', origem: '2204303', ateAno: 1992 }, // Caldeirão Grande do Piauí ← Fronteiras
  { uf: 'pi', novo: '2202133', origem: '2205201', ateAno: 1992 }, // Campo Grande do Piauí ← Jaicós
  { uf: 'pi', novo: '2202174', origem: '2208502', ateAno: 1992 }, // Campo Largo do Piauí ← Porto
  { uf: 'pi', novo: '2202251', origem: '2205300', ateAno: 1992 }, // Canavieira ← Jerumenha
  { uf: 'pi', novo: '2202455', origem: '2210003', ateAno: 1992 }, // Capitão Gervásio Oliveira ← São João do Piauí
  { uf: 'pi', novo: '2202554', origem: '2210706', ateAno: 1992 }, // Caridade do Piauí ← Simões
  { uf: 'pi', novo: '2202737', origem: '2200400', ateAno: 1992 }, // Coivaras ← Altos
  { uf: 'pi', novo: '2202752', origem: '2203602', ateAno: 1992 }, // Colônia do Gurguéia ← Eliseu Martins
  { uf: 'pi', novo: '2202778', origem: '2207009', ateAno: 1992 }, // Colônia do Piauí ← Oeiras
  { uf: 'pi', novo: '2202851', origem: '2210607', ateAno: 1992 }, // Coronel José Dias ← São Raimundo Nonato
  { uf: 'pi', novo: '2203230', origem: '2201903', ateAno: 1992 }, // Currais ← Bom Jesus
  { uf: 'pi', novo: '2203271', origem: '2210706', ateAno: 1992 }, // Curral Novo do Piauí ← Simões
  { uf: 'pi', novo: '2203750', origem: '2203354', ateAno: 1992 }, // Fartura do Piauí ← Dirceu Arcoverde
  { uf: 'pi', novo: '2204352', origem: '2208007', ateAno: 1992 }, // Geminiano ← Picos
  { uf: 'pi', novo: '2204550', origem: '2202505', ateAno: 1992 }, // Guaribas ← Caracol
  { uf: 'pi', novo: '2204659', origem: '2207702', ateAno: 1992 }, // Ilha Grande ← Parnaíba
  { uf: 'pi', novo: '2205151', origem: '2207801', ateAno: 1992 }, // Jacobina do Piauí ← Paulistana
  { uf: 'pi', novo: '2205250', origem: '2208809', ateAno: 1992 }, // Jardim do Mulato ← Regeneração
  { uf: 'pi', novo: '2205524', origem: '2203206', ateAno: 1992 }, // Júlio Borges ← Curimatá
  { uf: 'pi', novo: '2205532', origem: '2200707', ateAno: 1992 }, // Jurema ← Anísio de Abreu
  { uf: 'pi', novo: '2205557', origem: '2211100', ateAno: 1992 }, // Lagoa Alegre ← União
  { uf: 'pi', novo: '2205565', origem: '2210003', ateAno: 1992 }, // Lagoa do Barro do Piauí ← São João do Piauí
  { uf: 'pi', novo: '2205573', origem: '2207900', ateAno: 1992 }, // Lagoa de São Francisco ← Pedro Ii
  { uf: 'pi', novo: '2205599', origem: '2211308', ateAno: 1992 }, // Lagoa do Sítio ← Valença do Piauí
  { uf: 'pi', novo: '2205953', origem: '2207207', ateAno: 1992 }, // Marcolândia ← Padre Marcos
  { uf: 'pi', novo: '2206357', origem: '2207900', ateAno: 1992 }, // Milton Brandão ← Pedro Ii
  { uf: 'pi', novo: '2206654', origem: '2201101', ateAno: 1992 }, // Morro Cabeça No Tempo ← Avelino Lopes
  { uf: 'pi', novo: '2206753', origem: '2202208', ateAno: 1992 }, // Nossa Senhora de Nazaré ← Campo Maior
  { uf: 'pi', novo: '2206951', origem: '2200301', ateAno: 1992 }, // Novo Santo Antônio ← Alto Longá
  { uf: 'pi', novo: '2207355', origem: '2202307', ateAno: 1992 }, // Pajeú do Piauí ← Canto do Buriti
  { uf: 'pi', novo: '2207553', origem: '2208007', ateAno: 1992 }, // Paquetá ← Picos
  { uf: 'pi', novo: '2207751', origem: '2201606', ateAno: 1992 }, // Passagem Franca do Piauí ← Beneditinos
  { uf: 'pi', novo: '2207777', origem: '2205201', ateAno: 1992 }, // Patos do Piauí ← Jaicós
  { uf: 'pi', novo: '2207850', origem: '2209005', ateAno: 1992 }, // Pavussu ← Rio Grande do Piauí
  { uf: 'pi', novo: '2207959', origem: '2210003', ateAno: 1992 }, // Nova Santa Rita ← São João do Piauí
  { uf: 'pi', novo: '2208650', origem: '2207801', ateAno: 1992 }, // Queimada Nova ← Paulistana
  { uf: 'pi', novo: '2208858', origem: '2207603', ateAno: 1992 }, // Riacho Frio ← Parnaguá
  { uf: 'pi', novo: '2209153', origem: '2200905', ateAno: 1992 }, // Santa Cruz dos Milagres ← Aroazes
  { uf: 'pi', novo: '2209351', origem: '2208007', ateAno: 1992 }, // Santana do Piauí ← Picos
  { uf: 'pi', novo: '2209377', origem: '2207009', ateAno: 1992 }, // Santa Rosa do Piauí ← Oeiras
  { uf: 'pi', novo: '2209559', origem: '2200707', ateAno: 1992 }, // São Braz do Piauí ← Anísio de Abreu
  { uf: 'pi', novo: '2209872', origem: '2208304', ateAno: 1992 }, // São João da Fronteira ← Piracuruca
  { uf: 'pi', novo: '2209955', origem: '2207009', ateAno: 1992 }, // São João da Varjota ← Oeiras
  { uf: 'pi', novo: '2209971', origem: '2206100', ateAno: 1992 }, // São João do Arraial ← Matias Olímpio
  { uf: 'pi', novo: '2210052', origem: '2208304', ateAno: 1992 }, // São José do Divino ← Piracuruca
  { uf: 'pi', novo: '2210359', origem: '2210607', ateAno: 1992 }, // São Lourenço do Piauí ← São Raimundo Nonato
  { uf: 'pi', novo: '2210623', origem: '2202901', ateAno: 1992 }, // Sebastião Barros ← Corrente
  { uf: 'pi', novo: '2210631', origem: '2201705', ateAno: 1992 }, // Sebastião Leal ← Bertolínia
  { uf: 'pi', novo: '2210656', origem: '2202208', ateAno: 1992 }, // Sigefredo Pacheco ← Campo Maior
  { uf: 'pi', novo: '2211357', origem: '2200707', ateAno: 1992 }, // Várzea Branca ← Anísio de Abreu
  { uf: 'pr', novo: '4101051', origem: '4106308', ateAno: 1992 }, // Anahy ← Corbélia
  { uf: 'pr', novo: '4101150', origem: '4110003', ateAno: 1992 }, // Ângulo ← Iguaraçu
  { uf: 'pr', novo: '4103024', origem: '4107207', ateAno: 1992 }, // Boa Esperança do Iguaçu ← Dois Vizinhos
  { uf: 'pr', novo: '4103222', origem: '4118501', ateAno: 1992 }, // Bom Sucesso do Sul ← Pato Branco
  { uf: 'pr', novo: '4103370', origem: '4100707', ateAno: 1992 }, // Brasilândia do Sul ← Alto Piquiri
  { uf: 'pr', novo: '4103479', origem: '4110607', ateAno: 1992 }, // Cafezal do Sul ← Iporã
  { uf: 'pr', novo: '4104428', origem: '4109401', ateAno: 1992 }, // Candói ← Guarapuava
  { uf: 'pr', novo: '4106571', origem: '4107207', ateAno: 1992 }, // Cruzeiro do Iguaçu ← Dois Vizinhos
  { uf: 'pr', novo: '4107124', origem: '4109302', ateAno: 1992 }, // Diamante do Sul ← Guaraniaçu
  { uf: 'pr', novo: '4107538', origem: '4114609', ateAno: 1992 }, // Entre Rios do Oeste ← Marechal Cândido Rondon
  { uf: 'pr', novo: '4107553', origem: '4104303', ateAno: 1992 }, // Farol ← Campo Mourão
  { uf: 'pr', novo: '4107652', origem: '4114302', ateAno: 1992 }, // Fazenda Rio Grande ← Mandirituba
  { uf: 'pr', novo: '4107850', origem: '4122800', ateAno: 1992 }, // Flor da Serra do Sul ← Salgado Filho
  { uf: 'pr', novo: '4108551', origem: '4125001', ateAno: 1992 }, // Godoy Moreira ← São João do Ivaí (revisado)
  { uf: 'pr', novo: '4109658', origem: '4114401', ateAno: 1992 }, // Honório Serpa ← Mangueirinha
  { uf: 'pr', novo: '4109757', origem: '4105003', ateAno: 1992 }, // Ibema ← Catanduvas
  { uf: 'pr', novo: '4110052', origem: '4106308', ateAno: 1992 }, // Iguatu ← Corbélia
  { uf: 'pr', novo: '4110656', origem: '4108205', ateAno: 1992 }, // Iracema do Oeste ← Formosa do Oeste
  { uf: 'pr', novo: '4110953', origem: '4125704', ateAno: 1992 }, // Itaipulândia ← São Miguel do Iguaçu
  { uf: 'pr', novo: '4111258', origem: '4122206', ateAno: 1992 }, // Itaperuçu ← Rio Branco do Sul
  { uf: 'pr', novo: '4111555', origem: '4128104', ateAno: 1992 }, // Ivaté ← Umuarama
  { uf: 'pr', novo: '4113254', origem: '4117800', ateAno: 1992 }, // Laranjal ← Palmital
  { uf: 'pr', novo: '4113429', origem: '4112504', ateAno: 1992 }, // Lidianópolis ← Jardim Alegre
  { uf: 'pr', novo: '4113452', origem: '4104808', ateAno: 1992 }, // Lindoeste ← Cascavel
  { uf: 'pr', novo: '4115358', origem: '4117909', ateAno: 1992 }, // Maripá ← Palotina
  { uf: 'pr', novo: '4115739', origem: '4119608', ateAno: 1992 }, // Mato Rico ← Pitanga
  { uf: 'pr', novo: '4115754', origem: '4114906', ateAno: 1992 }, // Mauá da Serra ← Marilândia do Sul
  { uf: 'pr', novo: '4115853', origem: '4114609', ateAno: 1992 }, // Mercedes ← Marechal Cândido Rondon
  { uf: 'pr', novo: '4116950', origem: '4107405', ateAno: 1992 }, // Nova Esperança do Sudoeste ← Enéas Marques
  { uf: 'pr', novo: '4117057', origem: '4113304', ateAno: 1992 }, // Nova Laranjeiras ← Laranjeiras do Sul
  { uf: 'pr', novo: '4117214', origem: '4123204', ateAno: 1992 }, // Nova Santa Bárbara ← Santa Cecília do Pavão
  { uf: 'pr', novo: '4117297', origem: '4103800', ateAno: 1992 }, // Novo Itacolomi ← Cambira
  { uf: 'pr', novo: '4117453', origem: '4127700', ateAno: 1992 }, // Ouro Verde do Oeste ← Toledo
  { uf: 'pr', novo: '4118451', origem: '4114609', ateAno: 1992 }, // Pato Bragado ← Marechal Cândido Rondon
  { uf: 'pr', novo: '4119152', origem: '4119509', ateAno: 1992 }, // Pinhais ← Piraquara
  { uf: 'pr', novo: '4119251', origem: '4124400', ateAno: 1992 }, // Pinhal de São Bento ← Santo Antônio do Sudoeste
  { uf: 'pr', novo: '4119657', origem: '4122404', ateAno: 1992 }, // Pitangueiras ← Rolândia
  { uf: 'pr', novo: '4120853', origem: '4114609', ateAno: 1992 }, // Quatro Pontes ← Marechal Cândido Rondon
  { uf: 'pr', novo: '4121257', origem: '4115606', ateAno: 1992 }, // Ramilândia ← Matelândia
  { uf: 'pr', novo: '4121356', origem: '4108601', ateAno: 1992 }, // Rancho Alegre d'Oeste ← Goioerê
  { uf: 'pr', novo: '4122156', origem: '4113304', ateAno: 1992 }, // Rio Bonito do Iguaçu ← Laranjeiras do Sul
  { uf: 'pr', novo: '4123824', origem: '4104600', ateAno: 1992 }, // Santa Lúcia ← Capitão Leônidas Marques
  { uf: 'pr', novo: '4123857', origem: '4119608', ateAno: 1992 }, // Santa Maria do Oeste ← Pitanga
  { uf: 'pr', novo: '4123956', origem: '4123709', ateAno: 1992 }, // Santa Mônica ← Santa Isabel do Ivaí
  { uf: 'pr', novo: '4124020', origem: '4104808', ateAno: 1992, desdeAno: 1983 }, // Santa Tereza do Oeste ← Cascavel
  { uf: 'pr', novo: '4125555', origem: '4110409', ateAno: 1992 }, // São Manoel do Paraná ← Indianópolis
  { uf: 'pr', novo: '4125753', origem: '4127700', ateAno: 1992 }, // São Pedro do Iguaçu ← Toledo
  { uf: 'pr', novo: '4126272', origem: '4105409', ateAno: 1992 }, // Saudade do Iguaçu ← Chopinzinho
  { uf: 'pr', novo: '4127882', origem: '4103107', ateAno: 1992 }, // Tunas do Paraná ← Bocaiúva do Sul
  { uf: 'pr', novo: '4128534', origem: '4127502', ateAno: 1992 }, // Ventania ← Tibagi
  { uf: 'pr', novo: '4128625', origem: '4128104', ateAno: 1992 }, // Alto Paraíso ← Umuarama
  { uf: 'pr', novo: '4128633', origem: '4105201', ateAno: 1992 }, // Doutor Ulysses ← Cerro Azul
  { uf: 'pr', novo: '4128658', origem: '4113304', ateAno: 1992 }, // Virmond ← Laranjeiras do Sul
  { uf: 'rj', novo: '3300159', origem: '3304706', ateAno: 1992 }, // Aperibé ← Santo Antônio de Pádua
  { uf: 'rj', novo: '3300225', origem: '3306008', ateAno: 1992 }, // Areal ← Três Rios
  { uf: 'rj', novo: '3300456', origem: '3303500', ateAno: 1992 }, // Belford Roxo ← Nova Iguaçu
  { uf: 'rj', novo: '3300951', origem: '3306008', ateAno: 1992 }, // Comendador Levy Gasparian ← Três Rios
  { uf: 'rj', novo: '3301157', origem: '3301009', ateAno: 1992 }, // Cardoso Moreira ← Campos dos Goytacazes
  { uf: 'rj', novo: '3301850', origem: '3302502', ateAno: 1992 }, // Guapimirim ← Magé
  { uf: 'rj', novo: '3302270', origem: '3303500', ateAno: 1992 }, // Japeri ← Nova Iguaçu
  { uf: 'rj', novo: '3304128', origem: '3300407', ateAno: 1992 }, // Quatis ← Barra Mansa
  { uf: 'rj', novo: '3304144', origem: '3303500', ateAno: 1992 }, // Queimados ← Nova Iguaçu
  { uf: 'rj', novo: '3304151', origem: '3302403', ateAno: 1992 }, // Quissamã ← Macaé (revisado)
  { uf: 'rj', novo: '3304524', origem: '3301306', ateAno: 1992 }, // Rio das Ostras ← Casimiro de Abreu
  { uf: 'rj', novo: '3306156', origem: '3303104', ateAno: 1992 }, // Varre-Sai ← Natividade
  { uf: 'rn', novo: '2401651', origem: '2411403', ateAno: 1992 }, // Bodó ← Santana do Matos
  { uf: 'rn', novo: '2401859', origem: '2411601', ateAno: 1992 }, // Caiçara do Norte ← São Bento do Norte
  { uf: 'rn', novo: '2403756', origem: '2400802', ateAno: 1992 }, // Fernando Pedroza ← Angicos
  { uf: 'rn', novo: '2404853', origem: '2404705', ateAno: 1992 }, // Itajá ← Ipanguaçu
  { uf: 'rn', novo: '2407252', origem: '2407005', ateAno: 1992 }, // Major Sales ← Luís Gomes
  { uf: 'rn', novo: '2412559', origem: '2414407', ateAno: 1992 }, // São Miguel do Gostoso ← Touros
  { uf: 'rn', novo: '2414159', origem: '2403806', ateAno: 1992 }, // Tenente Laurentino Cruz ← Florânia
  { uf: 'rn', novo: '2414456', origem: '2401305', ateAno: 1992 }, // Triunfo Potiguar ← Campo Grande
  { uf: 'rn', novo: '2414753', origem: '2412500', ateAno: 1992 }, // Venha-Ver ← São Miguel
  { uf: 'ro', novo: '1100072', origem: '1100064', ateAno: 1992 }, // Corumbiara ← Colorado do Oeste
  { uf: 'ro', novo: '1100262', origem: '1100023', ateAno: 1992 }, // Rio Crespo ← Ariquemes
  { uf: 'ro', novo: '1100403', origem: '1100023', ateAno: 1992 }, // Alto Paraíso ← Ariquemes (revisado)
  { uf: 'ro', novo: '1100502', origem: '1100288', ateAno: 1992 }, // Novo Horizonte do Oeste ← Rolim de Moura
  { uf: 'ro', novo: '1100601', origem: '1100023', ateAno: 1992 }, // Cacaulândia ← Ariquemes
  { uf: 'ro', novo: '1100700', origem: '1100023', ateAno: 1992 }, // Campo Novo de Rondônia ← Ariquemes
  { uf: 'ro', novo: '1100809', origem: '1100205', ateAno: 1992 }, // Candeias do Jamari ← Porto Velho
  { uf: 'ro', novo: '1100908', origem: '1100288', ateAno: 1992 }, // Castanheiras ← Rolim de Moura
  { uf: 'ro', novo: '1101005', origem: '1100114', ateAno: 1992 }, // Governador Jorge Teixeira ← Jaru
  { uf: 'ro', novo: '1101104', origem: '1100205', ateAno: 1992 }, // Itapuã do Oeste ← Porto Velho
  { uf: 'ro', novo: '1101203', origem: '1100049', ateAno: 1992 }, // Ministro Andreazza ← Cacoal
  { uf: 'ro', novo: '1101302', origem: '1100155', ateAno: 1992 }, // Mirante da Serra ← Ouro Preto do Oeste
  { uf: 'ro', novo: '1101401', origem: '1100023', ateAno: 1992 }, // Monte Negro ← Ariquemes
  { uf: 'ro', novo: '1101500', origem: '1100320', ateAno: 1992 }, // Seringueiras ← São Miguel do Guaporé
  { uf: 'ro', novo: '1101609', origem: '1100114', ateAno: 1992 }, // Theobroma ← Jaru
  { uf: 'ro', novo: '1101708', origem: '1100346', ateAno: 1992 }, // Urupá ← Alvorada do Oeste
  { uf: 'ro', novo: '1101807', origem: '1100155', ateAno: 1992 }, // Vale do Paraíso ← Ouro Preto do Oeste
  { uf: 'rs', novo: '4300570', origem: '4308102', ateAno: 1992 }, // Alto Feliz ← Feliz
  { uf: 'rs', novo: '4300646', origem: '4314704', ateAno: 1992 }, // Ametista do Sul ← Planalto
  { uf: 'rs', novo: '4300851', origem: '4303509', ateAno: 1992 }, // Arambaré ← Camaquã
  { uf: 'rs', novo: '4301750', origem: '4318408', ateAno: 1992 }, // Barão do Triunfo ← São Jerônimo
  { uf: 'rs', novo: '4301859', origem: '4321402', ateAno: 1992 }, // Barra do Guarita ← Tenente Portela
  { uf: 'rs', novo: '4301925', origem: '4300901', ateAno: 1992 }, // Barra do Rio Azul ← Aratiba
  { uf: 'rs', novo: '4301958', origem: '4320107', ateAno: 1992 }, // Barra Funda ← Sarandi
  { uf: 'rs', novo: '4302154', origem: '4313706', ateAno: 1992 }, // Boa Vista das Missões ← Palmeira das Missões
  { uf: 'rs', novo: '4302378', origem: '4304002', ateAno: 1992 }, // Bom Progresso ← Campo Novo
  { uf: 'rs', novo: '4303673', origem: '4322509', ateAno: 1992 }, // Campestre da Serra ← Vacaria
  { uf: 'rs', novo: '4304358', origem: '4301602', ateAno: 1992 }, // Candiota ← Bagé
  { uf: 'rs', novo: '4304697', origem: '4301008', ateAno: 1992 }, // Capitão ← Arroio do Meio
  { uf: 'rs', novo: '4304853', origem: '4322905', ateAno: 1992 }, // Carlos Gomes ← Viadutos
  { uf: 'rs', novo: '4305116', origem: '4301552', ateAno: 1992 }, // Centenário ← Áurea
  { uf: 'rs', novo: '4305371', origem: '4320909', ateAno: 1992 }, // Charrua ← Tapejara
  { uf: 'rs', novo: '4305587', origem: '4307807', ateAno: 1992 }, // Colinas ← Estrela
  { uf: 'rs', novo: '4305850', origem: '4304705', ateAno: 1992 }, // Coqueiros do Sul ← Carazinho
  { uf: 'rs', novo: '4305871', origem: '4310207', ateAno: 1992 }, // Coronel Barros ← Ijuí
  { uf: 'rs', novo: '4305975', origem: '4314100', ateAno: 1992 }, // Coxilha ← Passo Fundo
  { uf: 'rs', novo: '4306320', origem: '4321402', ateAno: 1992 }, // Derrubadas ← Tenente Portela
  { uf: 'rs', novo: '4306429', origem: '4307302', ateAno: 1992 }, // Dois Irmãos das Missões ← Erval Seco
  { uf: 'rs', novo: '4306924', origem: '4305801', ateAno: 1992 }, // Engenho Velho ← Constantina
  { uf: 'rs', novo: '4308656', origem: '4318002', ateAno: 1992 }, // Garruchos ← São Borja
  { uf: 'rs', novo: '4308854', origem: '4311809', ateAno: 1992 }, // Gentil ← Marau
  { uf: 'rs', novo: '4309126', origem: '4312708', ateAno: 1992 }, // Gramado dos Loureiros ← Nonoai
  { uf: 'rs', novo: '4309159', origem: '4316808', ateAno: 1992 }, // Gramado Xavier ← Santa Cruz do Sul
  { uf: 'rs', novo: '4309654', origem: '4301602', ateAno: 1992 }, // Hulha Negra ← Bagé
  { uf: 'rs', novo: '4310413', origem: '4305405', ateAno: 1992 }, // Inhacorá ← Chiapetta
  { uf: 'rs', novo: '4310579', origem: '4301404', ateAno: 1992 }, // Itapuca ← Arvorezinha
  { uf: 'rs', novo: '4311270', origem: '4321006', ateAno: 1992 }, // Lagoa dos Três Cantos ← Tapera
  { uf: 'rs', novo: '4311429', origem: '4310850', ateAno: 1992 }, // Lajeado do Bugre ← Jaboticaba
  { uf: 'rs', novo: '4311627', origem: '4310801', ateAno: 1992 }, // Lindolfo Collor ← Ivoti
  { uf: 'rs', novo: '4311643', origem: '4308102', ateAno: 1992 }, // Linha Nova ← Feliz
  { uf: 'rs', novo: '4311759', origem: '4318101', ateAno: 1992 }, // Manoel Viana ← São Francisco de Assis
  { uf: 'rs', novo: '4311775', origem: '4313508', ateAno: 1992 }, // Maquiné ← Osório
  { uf: 'rs', novo: '4311791', origem: '4302659', ateAno: 1992 }, // Maratá ← Brochier
  { uf: 'rs', novo: '4311981', origem: '4301909', ateAno: 1992 }, // Mariana Pimentel ← Barra do Ribeiro
  { uf: 'rs', novo: '4312138', origem: '4314100', ateAno: 1992 }, // Mato Castelhano ← Passo Fundo
  { uf: 'rs', novo: '4312153', origem: '4322608', ateAno: 1992 }, // Mato Leitão ← Venâncio Aires
  { uf: 'rs', novo: '4312252', origem: '4302709', ateAno: 1992 }, // Minas do Leão ← Butiá
  { uf: 'rs', novo: '4312385', origem: '4302105', ateAno: 1992 }, // Monte Belo do Sul ← Bento Gonçalves
  { uf: 'rs', novo: '4312427', origem: '4320800', ateAno: 1992 }, // Mormaço ← Soledade
  { uf: 'rs', novo: '4312443', origem: '4321501', ateAno: 1992 }, // Morrinhos do Sul ← Torres
  { uf: 'rs', novo: '4312476', origem: '4306403', ateAno: 1992 }, // Morro Reuter ← Dois Irmãos
  { uf: 'rs', novo: '4312625', origem: '4309902', ateAno: 1992 }, // Muliterno ← Ibiraiaras
  { uf: 'rs', novo: '4312674', origem: '4311809', ateAno: 1992 }, // Nicolau Vergueiro ← Marau
  { uf: 'rs', novo: '4312955', origem: '4320107', ateAno: 1992 }, // Nova Boa Vista ← Sarandi
  { uf: 'rs', novo: '4313086', origem: '4308201', ateAno: 1992 }, // Nova Pádua ← Flores da Cunha
  { uf: 'rs', novo: '4313375', origem: '4304606', ateAno: 1992 }, // Nova Santa Rita ← Canoas
  { uf: 'rs', novo: '4313425', origem: '4322103', ateAno: 1992 }, // Novo Machado ← Tucunduva
  { uf: 'rs', novo: '4313441', origem: '4315909', ateAno: 1992 }, // Novo Tiradentes ← Rodeio Bonito
  { uf: 'rs', novo: '4313490', origem: '4313706', ateAno: 1992 }, // Novo Barreiro ← Palmeira das Missões
  { uf: 'rs', novo: '4314035', origem: '4312401', ateAno: 1992 }, // Pareci Novo ← Montenegro
  { uf: 'rs', novo: '4314076', origem: '4315701', ateAno: 1992 }, // Passo do Sobrado ← Rio Pardo
  { uf: 'rs', novo: '4314423', origem: '4313201', ateAno: 1992 }, // Picada Café ← Nova Petrópolis
  { uf: 'rs', novo: '4314472', origem: '4311205', ateAno: 1992 }, // Pinhal Grande ← Júlio de Castilhos
  { uf: 'rs', novo: '4314498', origem: '4313805', ateAno: 1992 }, // Pinheirinho do Vale ← Palmitinho
  { uf: 'rs', novo: '4314779', origem: '4314100', ateAno: 1992 }, // Pontão ← Passo Fundo
  { uf: 'rs', novo: '4314787', origem: '4310900', ateAno: 1992 }, // Ponte Preta ← Jacutinga
  { uf: 'rs', novo: '4315057', origem: '4322301', ateAno: 1992 }, // Porto Mauá ← Tuparendi
  { uf: 'rs', novo: '4315073', origem: '4315008', ateAno: 1992 }, // Porto Vera Cruz ← Porto Lucena
  { uf: 'rs', novo: '4315149', origem: '4310801', ateAno: 1992 }, // Presidente Lucena ← Ivoti
  { uf: 'rs', novo: '4315321', origem: '4311205', ateAno: 1992 }, // Quevedos ← Júlio de Castilhos
  { uf: 'rs', novo: '4315552', origem: '4312708', ateAno: 1992 }, // Rio dos Índios ← Nonoai
  { uf: 'rs', novo: '4316428', origem: '4310850', ateAno: 1992 }, // Sagrada Família ← Jaboticaba
  { uf: 'rs', novo: '4316477', origem: '4305207', ateAno: 1992 }, // Salvador das Missões ← Cerro Largo
  { uf: 'rs', novo: '4316758', origem: '4311403', ateAno: 1992 }, // Santa Clara do Sul ← Lajeado
  { uf: 'rs', novo: '4317251', origem: '4302105', ateAno: 1992 }, // Santa Tereza ← Bento Gonçalves
  { uf: 'rs', novo: '4317558', origem: '4304903', ateAno: 1992 }, // Santo Antônio do Palma ← Casca
  { uf: 'rs', novo: '4317756', origem: '4304705', ateAno: 1992 }, // Santo Antônio do Planalto ← Carazinho
  { uf: 'rs', novo: '4317954', origem: '4303202', ateAno: 1992 }, // Santo Expedito do Sul ← Cacique Doble
  { uf: 'rs', novo: '4318432', origem: '4308003', ateAno: 1992 }, // São João do Polêsine ← Faxinal do Soturno
  { uf: 'rs', novo: '4318457', origem: '4313706', ateAno: 1992 }, // São José das Missões ← Palmeira das Missões
  { uf: 'rs', novo: '4318499', origem: '4321808', ateAno: 1992 }, // São José do Inhacorá ← Três de Maio
  { uf: 'rs', novo: '4318622', origem: '4302303', ateAno: 1992 }, // São José dos Ausentes ← Bom Jesus
  { uf: 'rs', novo: '4319125', origem: '4316907', ateAno: 1992 }, // São Martinho da Serra ← Santa Maria
  { uf: 'rs', novo: '4319356', origem: '4316501', ateAno: 1992 }, // São Pedro da Serra ← Salvador do Sul
  { uf: 'rs', novo: '4319372', origem: '4305207', ateAno: 1992 }, // São Pedro do Butiá ← Cerro Largo
  { uf: 'rs', novo: '4319711', origem: '4306452', ateAno: 1992 }, // São Valentim do Sul ← Dois Lajeados
  { uf: 'rs', novo: '4319737', origem: '4306106', ateAno: 1992 }, // São Valério do Sul ← Cruz Alta
  { uf: 'rs', novo: '4320354', origem: '4321105', ateAno: 1992 }, // Sentinela do Sul ← Tapes
  { uf: 'rs', novo: '4320453', origem: '4311403', ateAno: 1992 }, // Sério ← Lajeado
  { uf: 'rs', novo: '4320552', origem: '4301909', ateAno: 1992 }, // Sertão Santana ← Barra do Ribeiro
  { uf: 'rs', novo: '4320677', origem: '4316808', ateAno: 1992 }, // Sinimbu ← Santa Cruz do Sul
  { uf: 'rs', novo: '4321477', origem: '4321907', ateAno: 1992 }, // Tiradentes do Sul ← Três Passos
  { uf: 'rs', novo: '4321626', origem: '4301008', ateAno: 1992 }, // Travesseiro ← Arroio do Meio
  { uf: 'rs', novo: '4321832', origem: '4321501', ateAno: 1992 }, // Três Forquilhas ← Torres
  { uf: 'rs', novo: '4322186', origem: '4318606', ateAno: 1992 }, // Tupanci do Sul ← São José do Ouro
  { uf: 'rs', novo: '4322350', origem: '4309407', ateAno: 1992 }, // União da Serra ← Guaporé
  { uf: 'rs', novo: '4322533', origem: '4316808', ateAno: 1992 }, // Vale do Sol ← Santa Cruz do Sul
  { uf: 'rs', novo: '4322541', origem: '4308102', ateAno: 1992 }, // Vale Real ← Feliz
  { uf: 'rs', novo: '4323457', origem: '4319604', ateAno: 1992 }, // Vila Nova do Sul ← São Sepé
  { uf: 'rs', novo: '4323754', origem: '4317509', ateAno: 1992 }, // Vitória das Missões ← Santo Ângelo
  { uf: 'rs', novo: '4323804', origem: '4304630', ateAno: 1992 }, // Xangri-Lá ← Capão da Canoa
  { uf: 'sc', novo: '4200556', origem: '4204400', ateAno: 1992 }, // Águas Frias ← Coronel Freitas
  { uf: 'sc', novo: '4201273', origem: '4204301', ateAno: 1992 }, // Arabutã ← Concórdia
  { uf: 'sc', novo: '4201653', origem: '4217501', ateAno: 1992 }, // Arvoredo ← Seara
  { uf: 'sc', novo: '4202057', origem: '4201307', ateAno: 1992 }, // Balneário Barra do Sul ← Araquari
  { uf: 'sc', novo: '4202156', origem: '4204905', ateAno: 1992 }, // Belmonte ← Descanso
  { uf: 'sc', novo: '4202453', origem: '4213500', ateAno: 1992 }, // Bombinhas ← Porto Belo
  { uf: 'sc', novo: '4202859', origem: '4218608', ateAno: 1992 }, // Braço do Trombudo ← Trombudo Central
  { uf: 'sc', novo: '4203154', origem: '4210704', ateAno: 1992 }, // Calmon ← Matos Costa
  { uf: 'sc', novo: '4203956', origem: '4218707', ateAno: 1992 }, // Capivari de Baixo ← Tubarão
  { uf: 'sc', novo: '4204178', origem: '4203402', ateAno: 1992 }, // Cerro Negro ← Campo Belo do Sul
  { uf: 'sc', novo: '4204251', origem: '4219002', ateAno: 1992 }, // Cocal do Sul ← Urussanga
  { uf: 'sc', novo: '4204350', origem: '4204202', ateAno: 1992 }, // Cordilheira Alta ← Chapecó
  { uf: 'sc', novo: '4204459', origem: '4216107', ateAno: 1992 }, // Coronel Martins ← São Domingos
  { uf: 'sc', novo: '4205431', origem: '4214201', ateAno: 1992 }, // Formosa do Sul ← Quilombo
  { uf: 'sc', novo: '4206652', origem: '4204202', ateAno: 1992 }, // Guatambú ← Chapecó
  { uf: 'sc', novo: '4207684', origem: '4200101', ateAno: 1992 }, // Ipuaçu ← Abelardo Luz
  { uf: 'sc', novo: '4207858', origem: '4214201', ateAno: 1992 }, // Irati ← Quilombo
  { uf: 'sc', novo: '4208955', origem: '4218855', ateAno: 1992 }, // Jardinópolis ← União do Oeste
  { uf: 'sc', novo: '4209458', origem: '4219705', ateAno: 1992 }, // Lajeado Grande ← Xaxim
  { uf: 'sc', novo: '4210050', origem: '4203006', ateAno: 1992 }, // Macieira ← Caçador
  { uf: 'sc', novo: '4210852', origem: '4217808', ateAno: 1992 }, // Mirim Doce ← Taió
  { uf: 'sc', novo: '4211058', origem: '4203600', ateAno: 1992 }, // Monte Carlo ← Campos Novos
  { uf: 'sc', novo: '4211256', origem: '4210803', ateAno: 1992 }, // Morro Grande ← Meleiro
  { uf: 'sc', novo: '4211454', origem: '4204202', ateAno: 1992 }, // Nova Itaberaba ← Chapecó
  { uf: 'sc', novo: '4211652', origem: '4216909', ateAno: 1992 }, // Novo Horizonte ← São Lourenço do Oeste
  { uf: 'sc', novo: '4211850', origem: '4200101', ateAno: 1992 }, // Ouro Verde ← Abelardo Luz
  { uf: 'sc', novo: '4212239', origem: '4217204', ateAno: 1992 }, // Paraíso ← São Miguel do Oeste
  { uf: 'sc', novo: '4212254', origem: '4216404', ateAno: 1992 }, // Passo de Torres ← São João do Sul
  { uf: 'sc', novo: '4212270', origem: '4213401', ateAno: 1992 }, // Passos Maia ← Ponte Serrada
  { uf: 'sc', novo: '4213153', origem: '4204103', ateAno: 1992 }, // Planalto Alegre ← Caxambu do Sul
  { uf: 'sc', novo: '4213351', origem: '4204806', ateAno: 1992 }, // Ponte Alta do Norte ← Curitibanos
  { uf: 'sc', novo: '4215059', origem: '4218905', ateAno: 1992 }, // Rio Rufino ← Urubici
  { uf: 'sc', novo: '4215075', origem: '4211009', ateAno: 1992 }, // Riqueza ← Mondaí
  { uf: 'sc', novo: '4215455', origem: '4208807', ateAno: 1992 }, // Sangão ← Jaguaruna
  { uf: 'sc', novo: '4215554', origem: '4204905', ateAno: 1992 }, // Santa Helena ← Descanso
  { uf: 'sc', novo: '4215679', origem: '4208104', ateAno: 1992 }, // Santa Terezinha ← Itaiópolis
  { uf: 'sc', novo: '4216057', origem: '4204806', ateAno: 1992 }, // São Cristóvão do Sul ← Curitibanos
  { uf: 'sc', novo: '4216255', origem: '4208401', ateAno: 1992 }, // São João do Oeste ← Itapiranga
  { uf: 'sc', novo: '4216354', origem: '4202107', ateAno: 1992 }, // São João do Itaperiú ← Barra Velha
  { uf: 'sc', novo: '4217154', origem: '4210506', ateAno: 1992 }, // São Miguel da Boa Vista ← Maravilha
  { uf: 'sc', novo: '4217758', origem: '4210902', ateAno: 1992 }, // Sul Brasil ← Modelo
  { uf: 'sc', novo: '4219150', origem: '4203600', ateAno: 1992 }, // Vargem ← Campos Novos
  { uf: 'sc', novo: '4219176', origem: '4204004', ateAno: 1992 }, // Vargem Bonita ← Catanduvas
  { uf: 'se', novo: '2806404', origem: '2804409', ateAno: 1992 }, // Santana do São Francisco ← Neópolis
  { uf: 'sp', novo: '3500758', origem: '3522307', ateAno: 1992 }, // Alambari ← Itapetininga
  { uf: 'sp', novo: '3501152', origem: '3528403', ateAno: 1992 }, // Alumínio ← Mairinque
  { uf: 'sp', novo: '3502754', origem: '3550605', ateAno: 1992 }, // Araçariguama ← São Roque
  { uf: 'sp', novo: '3503158', origem: '3504909', ateAno: 1992 }, // Arapeí ← Bananal
  { uf: 'sp', novo: '3503950', origem: '3555802', ateAno: 1992 }, // Aspásia ← Urânia
  { uf: 'sp', novo: '3505351', origem: '3502705', ateAno: 1992 }, // Barra do Chapéu ← Apiaí
  { uf: 'sp', novo: '3506359', origem: '3548500', ateAno: 1992 }, // Bertioga ← Santos
  { uf: 'sp', novo: '3507159', origem: '3523206', ateAno: 1992 }, // Bom Sucesso de Itararé ← Itararé
  { uf: 'sp', novo: '3507456', origem: '3526803', ateAno: 1992 }, // Borebi ← Lençóis Paulista
  { uf: 'sp', novo: '3509254', origem: '3524600', ateAno: 1992, desdeAno: 1983 }, // Cajati ← Jacupiranga
  { uf: 'sp', novo: '3509452', origem: '3502200', ateAno: 1992 }, // Campina do Monte Alegre ← Angatuba
  { uf: 'sp', novo: '3510153', origem: '3557204', ateAno: 1992 }, // Canitar ← Chavantes
  { uf: 'sp', novo: '3513850', origem: '3549003', ateAno: 1992 }, // Dirce Reis ← São Francisco
  { uf: 'sp', novo: '3514924', origem: '3511102', ateAno: 1992 }, // Elisiário ← Catanduva
  { uf: 'sp', novo: '3514957', origem: '3509304', ateAno: 1992 }, // Embaúba ← Cajobi
  { uf: 'sp', novo: '3515129', origem: '3541208', ateAno: 1992 }, // Emilianópolis ← Presidente Bernardes
  { uf: 'sp', novo: '3515152', origem: '3503802', ateAno: 1992 }, // Engenheiro Coelho ← Artur Nogueira
  { uf: 'sp', novo: '3515194', origem: '3546405', ateAno: 1992 }, // Espírito Santo do Turvo ← Santa Cruz do Rio Pardo
  { uf: 'sp', novo: '3515350', origem: '3554300', ateAno: 1992 }, // Euclides da Cunha Paulista ← Teodoro Sampaio
  { uf: 'sp', novo: '3518859', origem: '3543402', ateAno: 1992 }, // Guatapará ← Ribeirão Preto
  { uf: 'sp', novo: '3519055', origem: '3524709', ateAno: 1992 }, // Holambra ← Jaguariúna
  { uf: 'sp', novo: '3519071', origem: '3552403', ateAno: 1992 }, // Hortolândia ← Sumaré
  { uf: 'sp', novo: '3519253', origem: '3500550', ateAno: 1992 }, // Iaras ← Águas de Santa Bárbara
  { uf: 'sp', novo: '3520426', origem: '3520301', ateAno: 1992 }, // Ilha Comprida ← Iguape
  { uf: 'sp', novo: '3520442', origem: '3537404', ateAno: 1992 }, // Ilha Solteira ← Pereira Barreto
  { uf: 'sp', novo: '3522158', origem: '3502705', ateAno: 1992 }, // Itaoca ← Apiaí
  { uf: 'sp', novo: '3522653', origem: '3542800', ateAno: 1992 }, // Itapirapuã Paulista ← Ribeira
  { uf: 'sp', novo: '3527256', origem: '3555208', ateAno: 1992 }, // Lourdes ← Turiúba
  { uf: 'sp', novo: '3528858', origem: '3521903', ateAno: 1992 }, // Marapoama ← Itajobi
  { uf: 'sp', novo: '3529658', origem: '3535903', ateAno: 1992 }, // Mesópolis ← Paranapuã
  { uf: 'sp', novo: '3532058', origem: '3503208', ateAno: 1992 }, // Motuca ← Araraquara
  { uf: 'sp', novo: '3532827', origem: '3522406', ateAno: 1992 }, // Nova Campina ← Itapeva
  { uf: 'sp', novo: '3532843', origem: '3554904', ateAno: 1992 }, // Nova Canaã Paulista ← Três Fronteiras
  { uf: 'sp', novo: '3533254', origem: '3552601', ateAno: 1992 }, // Novais ← Tabapuã
  { uf: 'sp', novo: '3536257', origem: '3557105', ateAno: 1992 }, // Parisi ← Votuporanga
  { uf: 'sp', novo: '3537156', origem: '3513306', ateAno: 1992 }, // Pedrinhas Paulista ← Cruzália
  { uf: 'sp', novo: '3540259', origem: '3524808', ateAno: 1992 }, // Pontalinda ← Jales
  { uf: 'sp', novo: '3540754', origem: '3518404', ateAno: 1992 }, // Potim ← Guaratinguetá
  { uf: 'sp', novo: '3543253', origem: '3510203', ateAno: 1992 }, // Ribeirão Grande ← Capão Bonito
  { uf: 'sp', novo: '3544251', origem: '3554300', ateAno: 1992 }, // Rosana ← Teodoro Sampaio
  { uf: 'sp', novo: '3545159', origem: '3538709', ateAno: 1992 }, // Saltinho ← Piracicaba
  { uf: 'sp', novo: '3548054', origem: '3502804', ateAno: 1992 }, // Santo Antônio do Aracanguá ← Araçatuba
  { uf: 'sp', novo: '3549250', origem: '3516903', ateAno: 1992 }, // São João de Iracema ← General Salgado
  { uf: 'sp', novo: '3549953', origem: '3522208', ateAno: 1992 }, // São Lourenço da Serra ← Itapecerica da Serra
  { uf: 'sp', novo: '3552551', origem: '3537404', ateAno: 1992 }, // Suzanápolis ← Pereira Barreto
  { uf: 'sp', novo: '3553856', origem: '3522406', ateAno: 1992 }, // Taquarivaí ← Itapeva
  { uf: 'sp', novo: '3553955', origem: '3504008', ateAno: 1992 }, // Tarumã ← Assis
  { uf: 'sp', novo: '3554656', origem: '3540507', ateAno: 1992 }, // Torre de Pedra ← Porangaba
  { uf: 'sp', novo: '3554953', origem: '3507605', ateAno: 1992 }, // Tuiuti ← Bragança Paulista
  { uf: 'sp', novo: '3555356', origem: '3525706', ateAno: 1992 }, // Ubarana ← José Bonifácio
  { uf: 'sp', novo: '3556354', origem: '3507605', ateAno: 1992 }, // Vargem ← Bragança Paulista
  { uf: 'sp', novo: '3557154', origem: '3539608', ateAno: 1992 }, // Zacarias ← Planalto
  { uf: 'sp', novo: '3557303', origem: '3530706', ateAno: 1992 }, // Estiva Gerbi ← Mogi Guaçu
  { uf: 'to', novo: '1700251', origem: '1701903', ateAno: 1992 }, // Abreulândia ← Araguacema
  { uf: 'to', novo: '1701051', origem: '1714302', ateAno: 1992 }, // Angico ← Nazaré
  { uf: 'to', novo: '1701309', origem: '1702109', ateAno: 1992 }, // Aragominas ← Araguaína
  { uf: 'to', novo: '1702158', origem: '1702109', ateAno: 1992 }, // Araguanã ← Araguaína
  { uf: 'to', novo: '1703305', origem: '1716505', ateAno: 1992 }, // Bom Jesus do Tocantins ← Pedro Afonso
  { uf: 'to', novo: '1703602', origem: '1718402', ateAno: 1992 }, // Brasilândia do Tocantins ← Presidente Kennedy
  { uf: 'to', novo: '1703826', origem: '1714302', ateAno: 1992 }, // Cachoeirinha ← Nazaré
  { uf: 'to', novo: '1703842', origem: '1709005', ateAno: 1992 }, // Campos Lindos ← Goiatins
  { uf: 'to', novo: '1703867', origem: '1709500', ateAno: 1992 }, // Cariri do Tocantins ← Gurupi
  { uf: 'to', novo: '1703883', origem: '1702109', ateAno: 1992 }, // Carmolândia ← Araguaína
  { uf: 'to', novo: '1703891', origem: '1718808', ateAno: 1992 }, // Carrasco Bonito ← Sampaio
  { uf: 'to', novo: '1704105', origem: '1710508', ateAno: 1992 }, // Centenário ← Itacajá
  { uf: 'to', novo: '1706506', origem: '1701002', ateAno: 1992 }, // Darcinópolis ← Ananás
  { uf: 'to', novo: '1707405', origem: '1702208', ateAno: 1992 }, // Esperantina ← Araguatins
  { uf: 'to', novo: '1708254', origem: '1709302', ateAno: 1992 }, // Tabocão ← Guaraí
  { uf: 'to', novo: '1710904', origem: '1710508', ateAno: 1992 }, // Itapiratins ← Itacajá
  { uf: 'to', novo: '1711506', origem: '1716604', ateAno: 1992 }, // Jaú do Tocantins ← Peixe
  { uf: 'to', novo: '1711803', origem: '1706001', ateAno: 1992 }, // Juarina ← Couto Magalhães
  { uf: 'to', novo: '1711902', origem: '1706100', ateAno: 1992 }, // Lagoa da Confusão ← Cristalândia
  { uf: 'to', novo: '1711951', origem: '1715101', ateAno: 1992 }, // Lagoa do Tocantins ← Novo Acordo
  { uf: 'to', novo: '1712009', origem: '1721109', ateAno: 1992 }, // Lajeado ← Tocantínia
  { uf: 'to', novo: '1712702', origem: '1717909', ateAno: 1992 }, // Mateiros ← Ponte Alta do Tocantins
  { uf: 'to', novo: '1712801', origem: '1710706', ateAno: 1992 }, // Maurilândia do Tocantins ← Itaguatins
  { uf: 'to', novo: '1713809', origem: '1714302', ateAno: 1992 }, // Palmeiras do Tocantins ← Nazaré
  { uf: 'to', novo: '1713957', origem: '1702109', ateAno: 1992 }, // Muricilândia ← Araguaína
  { uf: 'to', novo: '1715150', origem: '1702406', ateAno: 1992 }, // Novo Alegre ← Arraias
  { uf: 'to', novo: '1715259', origem: '1717800', ateAno: 1992 }, // Novo Jardim ← Ponte Alta do Bom Jesus
  { uf: 'to', novo: '1715705', origem: '1707702', ateAno: 1992 }, // Palmeirante ← Filadélfia
  { uf: 'to', novo: '1716307', origem: '1702307', ateAno: 1992 }, // Pau d'Arco ← Arapoema
  { uf: 'to', novo: '1717206', origem: '1722107', ateAno: 1992 }, // Piraquê ← Xambioá
  { uf: 'to', novo: '1718501', origem: '1710508', ateAno: 1992 }, // Recursolândia ← Itacajá
  { uf: 'to', novo: '1718550', origem: '1701002', ateAno: 1992 }, // Riachinho ← Ananás
  { uf: 'to', novo: '1718659', origem: '1707009', ateAno: 1992 }, // Rio da Conceição ← Dianópolis
  { uf: 'to', novo: '1718709', origem: '1713304', ateAno: 1992 }, // Rio dos Bois ← Miranorte
  { uf: 'to', novo: '1718840', origem: '1702000', ateAno: 1992 }, // Sandolândia ← Araguaçu
  { uf: 'to', novo: '1718865', origem: '1702109', ateAno: 1992 }, // Santa Fé do Araguaia ← Araguaína
  { uf: 'to', novo: '1718881', origem: '1716505', ateAno: 1992 }, // Santa Maria do Tocantins ← Pedro Afonso
  { uf: 'to', novo: '1720101', origem: '1702208', ateAno: 1992 }, // São Bento do Tocantins ← Araguatins
  { uf: 'to', novo: '1720150', origem: '1715101', ateAno: 1992 }, // São Félix do Tocantins ← Novo Acordo
  { uf: 'to', novo: '1720200', origem: '1720804', ateAno: 1992 }, // São Miguel do Tocantins ← Sítio Novo do Tocantins
  { uf: 'to', novo: '1720259', origem: '1715754', ateAno: 1992 }, // São Salvador do Tocantins ← Palmeirópolis
  { uf: 'to', novo: '1720853', origem: '1716604', ateAno: 1992 }, // Sucupira ← Peixe
  { uf: 'to', novo: '1720937', origem: '1705607', ateAno: 1992 }, // Taipas do Tocantins ← Conceição do Tocantins
  { uf: 'to', novo: '1721307', origem: '1718402', ateAno: 1992 }, // Tupiratins ← Presidente Kennedy
  // criados em 2013 (primeira eleição municipal em 2012): em 2010 ainda votavam na origem
  { uf: 'sc', novo: '4212650', origem: '4209409', ateAno: 2011 }, // Pescaria Brava ← Laguna
  { uf: 'sc', novo: '4220000', origem: '4207007', ateAno: 2011 }, // Balneário Rincão ← Içara
  { uf: 'pa', novo: '1504752', origem: '1506807', ateAno: 2011 }, // Mojuí dos Campos ← Santarém
  { uf: 'rs', novo: '4314548', origem: '4302105', ateAno: 2011 }, // Pinto Bandeira ← Bento Gonçalves
  { uf: 'ms', novo: '5006275', origem: '5003256', ateAno: 2011 }, // Paraíso das Águas ← Costa Rica
  // 1986: criados em 1987–1988 (sem voto em 1986 nas planilhas de MA, MG, MS e SP); mesma origem do bloco de 1982
  { uf: 'ma', novo: '2100956', origem: '2104800', ateAno: 1986 }, // ARAME ← GRAJAÚ
  { uf: 'ma', novo: '2106755', origem: '2105401', ateAno: 1986 }, // MIRANDA DO NORTE ← ITAPECURU MIRIM
  { uf: 'ma', novo: '2110039', origem: '2102606', ateAno: 1986 }, // SANTA LUZIA DO PARUÁ ← CÂNDIDO MENDES
  { uf: 'ma', novo: '2114007', origem: '2106904', ateAno: 1986 }, // ZÉ DOCA ← MONÇÃO
  { uf: 'mg', novo: '3133758', origem: '3152907', ateAno: 1986 }, // ITAÚ DE MINAS ← PRATÁPOLIS
  { uf: 'ms', novo: '5002951', origem: '5002902', ateAno: 1986 }, // CHAPADÃO DO SUL ← CASSILÂNDIA
  { uf: 'ms', novo: '5003157', origem: '5000609', ateAno: 1986 }, // CORONEL SAPUCAIA ← AMAMBAI
  { uf: 'ms', novo: '5003488', origem: '5000708', ateAno: 1986 }, // DOIS IRMÃOS DO BURITI ← ANASTÁCIO
  { uf: 'ms', novo: '5005152', origem: '5002407', ateAno: 1986 }, // JUTI ← CAARAPÓ
  { uf: 'ms', novo: '5006358', origem: '5007703', ateAno: 1986 }, // PARANHOS ← SETE QUEDAS
  { uf: 'ms', novo: '5007554', origem: '5002308', ateAno: 1986 }, // SANTA RITA DO PARDO ← BRASILÂNDIA
  { uf: 'ms', novo: '5007935', origem: '5006408', ateAno: 1986 }, // SONORA ← PEDRO GOMES
  { uf: 'ms', novo: '5008404', origem: '5003801', ateAno: 1986 }, // VICENTINA ← FÁTIMA DO SUL
];

/** Fusões que valem no ano; quando a origem também ainda não existia, segue até o município que existia. */
export const fusoesDoAno = (ano) => {
  const lista = FUSOES.filter((f) => ano <= f.ateAno && !(f.desdeAno > ano));
  const de = new Map(lista.map((f) => [f.novo, f.origem]));
  return lista.map((f) => {
    let o = f.origem;
    for (let i = 0; de.has(o) && i < 10; i++) o = de.get(o);
    return o === f.origem ? f : { ...f, origem: o };
  });
};
