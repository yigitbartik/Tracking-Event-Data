
export const RAW_MATCH_INFO_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<PutDataRequest>
    <MatchInformation>
        <General MatchId="DFL-MAT-002780" HomeTeamName="Hertha BSC" HomeTeamId="DFL-CLU-00000Z" GuestTeamName="Sport-Club Freiburg" GuestTeamId="DFL-CLU-00000A" Result="2:1"/>
        <Environment PitchX="105.0" PitchY="68.0"/>
        <Teams>
            <Team TeamId="DFL-CLU-00000Z" TeamName="Hertha BSC" Role="home" PlayerShirtMainColor="#0000FF" PlayerShirtSecondaryColor="#FFFFFF">
                <Players>
                    <Player PersonId="DFL-OBJ-0002DK" ShirtNumber="14" FirstName="Valentin" LastName="Stocker" Shortname="V. Stocker" />
                    <Player PersonId="DFL-OBJ-000282" ShirtNumber="22" FirstName="Rune" LastName="Jarstein" Shortname="Rune Jarstein" />
                    <Player PersonId="DFL-OBJ-0000W7" ShirtNumber="19" FirstName="Vedad" LastName="Ibisevic" Shortname="V. Ibisevic" />
                    <Player PersonId="DFL-OBJ-0000RT" ShirtNumber="25" FirstName="John Anthony" LastName="Brooks" Shortname="J. Brooks" />
                </Players>
            </Team>
            <Team TeamId="DFL-CLU-00000A" TeamName="Sport-Club Freiburg" Role="guest" PlayerShirtMainColor="#FF0000" PlayerShirtSecondaryColor="#000000">
                <Players>
                    <Player PersonId="DFL-OBJ-0000D9" ShirtNumber="27" FirstName="Nicolas" LastName="Höfler" Shortname="N. Höfler" />
                    <Player PersonId="DFL-OBJ-0001E6" ShirtNumber="32" FirstName="Vincenzo" LastName="Grifo" Shortname="V. Grifo" />
                    <Player PersonId="DFL-OBJ-0000IU" ShirtNumber="18" FirstName="Nils" LastName="Petersen" Shortname="N. Petersen" />
                    <Player PersonId="DFL-OBJ-002709" ShirtNumber="4" FirstName="Çaglar" LastName="Söyüncü" Shortname="Ç. Söyüncü" />
                </Players>
            </Team>
        </Teams>
    </MatchInformation>
</PutDataRequest>`;

export const RAW_TRACKING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<PutDataRequest>
    <Positions>
        <FrameSet GameSection="secondHalf" TeamId="DFL-CLU-00000A" PersonId="DFL-OBJ-0000D9">
            <Frame N="100001" T="2016-08-28T16:33:18.680+02:00" X="9.19" Y="-3.46" S="0.00" M="46"/>
            <Frame N="100002" T="2016-08-28T16:33:18.720+02:00" X="9.19" Y="-3.46" S="0.44" M="46"/>
            <Frame N="100003" T="2016-08-28T16:33:18.760+02:00" X="9.18" Y="-3.46" S="0.31" M="46"/>
            <Frame N="100004" T="2016-08-28T16:33:18.800+02:00" X="9.18" Y="-3.46" S="0.27" M="46"/>
            <Frame N="100005" T="2016-08-28T16:33:18.840+02:00" X="9.18" Y="-3.46" S="0.27" M="46"/>
            <Frame N="100006" T="2016-08-28T16:33:18.880+02:00" X="9.18" Y="-3.45" S="0.34" M="46"/>
            <Frame N="100007" T="2016-08-28T16:33:18.920+02:00" X="9.18" Y="-3.45" S="0.34" M="46"/>
            <Frame N="100008" T="2016-08-28T16:33:18.960+02:00" X="9.17" Y="-3.45" S="0.45" M="46"/>
            <Frame N="100009" T="2016-08-28T16:33:19.000+02:00" X="9.17" Y="-3.45" S="0.45" M="46"/>
            <Frame N="100010" T="2016-08-28T16:33:19.040+02:00" X="9.17" Y="-3.44" S="0.57" M="46"/>
            <Frame N="100053" T="2016-08-28T16:33:20.760+02:00" X="8.97" Y="-3.06" S="1.50" M="46"/>
        </FrameSet>
        <!-- Simulated extra player for visual completeness -->
        <FrameSet GameSection="secondHalf" TeamId="DFL-CLU-00000Z" PersonId="DFL-OBJ-0000W7">
            <Frame N="100001" T="2016-08-28T16:33:18.680+02:00" X="-5.00" Y="10.00" S="2.00" M="46"/>
            <Frame N="100053" T="2016-08-28T16:33:20.760+02:00" X="-4.50" Y="10.20" S="2.10" M="46"/>
        </FrameSet>
    </Positions>
</PutDataRequest>`;

export const RAW_EVENTS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Games timestamp="2016-08-29T17:16:40">
  <Game id="861393" away_team_id="160" away_team_name="Sport-Club Freiburg" home_team_id="162" home_team_name="Hertha BSC">
    <Event id="1107274716" event_id="464" type_id="32" period_id="2" min="45" sec="0" team_id="160" outcome="1" x="0.0" y="0.0" timestamp="2016-08-28T15:33:18.787" last_modified="2016-08-28T15:33:19">
      <Q id="1698900714" qualifier_id="127" value="Right to Left" />
    </Event>
    <Event id="1572596443" event_id="465" type_id="1" period_id="2" min="45" sec="0" player_id="101009" team_id="160" outcome="1" x="49.0" y="48.9" timestamp="2016-08-28T15:33:19.567">
      <Q id="1419959874" qualifier_id="140" value="51.0" />
      <Q id="1489550912" qualifier_id="141" value="48.7" />
    </Event>
    <Event id="1695127981" event_id="466" type_id="1" period_id="2" min="45" sec="1" player_id="182954" team_id="160" outcome="0" x="51.4" y="50.7" timestamp="2016-08-28T15:33:20.751">
    </Event>
     <Event id="192084566" event_id="467" type_id="67" period_id="2" min="45" sec="4" player_id="111453" team_id="160" outcome="0" x="62.9" y="33.6" timestamp="2016-08-28T15:33:23.248">
    </Event>
  </Game>
</Games>`;
